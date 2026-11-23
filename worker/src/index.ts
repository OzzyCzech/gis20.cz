// The whole gis20.cz site: static Astro build (ASSETS) plus the RSVP API under /api/
// (sign up, cancel via a link from the confirmation e-mail, public head count).
// Data lives in D1 (see ../schema.sql); e-mails go out through Resend.
// The API is public, so it only ever returns a count, never names or addresses.

interface D1Result<T> {
	results: T[];
}
interface D1PreparedStatement {
	bind(...values: unknown[]): D1PreparedStatement;
	first<T>(): Promise<T | null>;
	run(): Promise<unknown>;
	all<T>(): Promise<D1Result<T>>;
}
interface D1Database {
	prepare(query: string): D1PreparedStatement;
}

interface ForwardableEmailMessage {
	readonly from: string;
	readonly to: string;
	forward(rcptTo: string, headers?: Headers): Promise<void>;
	setReject(reason: string): void;
}

interface Env {
	ASSETS: { fetch(request: Request): Promise<Response> };
	DB: D1Database;
	RESEND_API_KEY?: string;
	/** Secret: comma-separated addresses that mail for sraz@gis20.cz is forwarded to (each verified in Email Routing). */
	FORWARD_TO?: string;
	MAIL_FROM: string;
	SITE_URL: string;
	ALLOWED_ORIGINS: string;
}

type Registration = { id: number; email: string; name: string; status: 'yes' | 'no'; token: string };

const EVENT = {
	title: 'Sraz gisáků po 20 letech',
	when: '19.–20. června 2027',
	where: 'vinný sklep v Dolních Bojanovicích',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?\d{9,15}$/;

const CANONICAL_HOST = 'gis20.cz';

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		// One canonical origin: https, no www (localhost and workers.dev previews are left alone).
		if (url.hostname === `www.${CANONICAL_HOST}` || (url.hostname === CANONICAL_HOST && url.protocol === 'http:')) {
			return Response.redirect(`https://${CANONICAL_HOST}${url.pathname}${url.search}`, 301);
		}
		if (url.pathname.startsWith('/api/')) return api(request, env, url.pathname.slice(4));

		// Static site. Keep every file out of search engines (the page also has a robots meta tag and robots.txt).
		const asset = await env.ASSETS.fetch(request);
		const response = new Response(asset.body, asset);
		response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
		return response;
	},

	// Email Routing sends sraz@gis20.cz here; a routing rule can only target one address, the Worker can fan out.
	async email(message: ForwardableEmailMessage, env: Env): Promise<void> {
		const targets = (env.FORWARD_TO ?? '')
			.split(',')
			.map((address) => address.trim())
			.filter(Boolean);
		if (!targets.length) {
			message.setReject('Mailbox not configured');
			return;
		}
		await Promise.all(targets.map((address) => message.forward(address)));
	},
};

async function api(request: Request, env: Env, pathname: string): Promise<Response> {
	const origin = request.headers.get('Origin') ?? '';
	const allowed = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
	const cors: Record<string, string> = allowed.includes(origin)
		? {
				'Access-Control-Allow-Origin': origin,
				'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type',
				'Access-Control-Max-Age': '86400',
				Vary: 'Origin',
			}
		: { Vary: 'Origin' };

	const json = (body: unknown, status = 200) =>
		new Response(JSON.stringify(body), {
			status,
			headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...cors },
		});

	if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

	try {
		if (request.method === 'GET' && pathname === '/count') return json({ count: await count(env) });

		if (request.method === 'POST') {
			const data = await readJson(request);
			if (!data) return json({ error: 'Neplatný požadavek.' }, 400);
			if (pathname === '/register') return json(...(await register(env, data)));
			if (pathname === '/cancel') return json(...(await cancel(env, data)));
			if (pathname === '/cancel-link') return json(...(await cancelLink(env, data)));
		}
		return json({ error: 'Nenalezeno.' }, 404);
	} catch (error) {
		console.error(error);
		return json({ error: 'Něco se pokazilo, zkuste to prosím později.' }, 500);
	}
}

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
	try {
		const data = await request.json();
		return data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
	} catch {
		return null;
	}
}

const text = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const now = () => new Date().toISOString();

async function count(env: Env): Promise<number> {
	const row = await env.DB.prepare("SELECT COUNT(*) AS n FROM registrations WHERE status = 'yes'").first<{ n: number }>();
	return row?.n ?? 0;
}

async function findByEmail(env: Env, email: string) {
	return env.DB.prepare('SELECT id, email, name, status, token FROM registrations WHERE email = ?').bind(email).first<Registration>();
}

async function register(env: Env, data: Record<string, unknown>): Promise<[unknown, number]> {
	// Honeypot: humans never see the field, bots fill it in. Pretend success.
	if (text(data.hp_check, 200)) return [{ ok: true, mailed: false }, 200];

	const name = text(data.name, 80);
	const email = text(data.email, 254).toLowerCase();
	const phone = text(data.phone, 24);
	const note = text(data.note, 500);
	if (name.length < 2) return [{ error: 'Vyplňte prosím jméno.' }, 400];
	// The name ends up in the e-mail body; keep links and markup out of it.
	if (/https?:|www\.|[<>/@]/i.test(name)) return [{ error: 'Jméno obsahuje nepovolené znaky.' }, 400];
	if (!EMAIL_RE.test(email)) return [{ error: 'Zkontrolujte prosím e-mail.' }, 400];
	if (!PHONE_RE.test(phone.replace(/[\s()-]/g, ''))) return [{ error: 'Zkontrolujte prosím telefon.' }, 400];

	const existing = await findByEmail(env, email);
	let token: string;
	if (existing) {
		token = existing.token;
		await env.DB.prepare("UPDATE registrations SET name = ?, phone = ?, note = ?, status = 'yes', updated_at = ?, cancelled_at = NULL WHERE id = ?")
			.bind(name, phone, note, now(), existing.id)
			.run();
	} else {
		token = crypto.randomUUID().replace(/-/g, '');
		const at = now();
		await env.DB.prepare("INSERT INTO registrations (email, name, phone, note, status, token, created_at, updated_at) VALUES (?, ?, ?, ?, 'yes', ?, ?, ?)")
			.bind(email, name, phone, note, token, at, at)
			.run();
	}

	// The cancel token only ever travels by e-mail, so knowing someone's address is not enough to cancel them.
	const mailed = await sendMail(env, email, `Přihláška na ${EVENT.title} je zapsaná`, [
		`Ahoj ${name},`,
		'',
		`přihláška na ${EVENT.title} je zapsaná. Sejdeme se ${EVENT.when}, ${EVENT.where}.`,
		'',
		`Pozvánka: ${env.SITE_URL}`,
		`Termín do kalendáře: ${new URL('sraz.ics', env.SITE_URL)}`,
		'',
		'Kdyby to nakonec nevyšlo, odhlásit se jde tady:',
		cancelUrl(env, token),
		'',
		'Gisácký deník',
	]);
	return [{ ok: true, mailed, count: await count(env) }, 200];
}

async function cancel(env: Env, data: Record<string, unknown>): Promise<[unknown, number]> {
	const token = text(data.token, 64);
	const row = token
		? await env.DB.prepare('SELECT id, email, name, status, token FROM registrations WHERE token = ?').bind(token).first<Registration>()
		: null;
	if (!row) return [{ error: 'Odkaz na odhlášení není platný.' }, 404];

	if (row.status === 'yes') {
		const at = now();
		await env.DB.prepare("UPDATE registrations SET status = 'no', updated_at = ?, cancelled_at = ? WHERE id = ?").bind(at, at, row.id).run();
	}
	return [{ ok: true, name: row.name, already: row.status === 'no', count: await count(env) }, 200];
}

async function cancelLink(env: Env, data: Record<string, unknown>): Promise<[unknown, number]> {
	const email = text(data.email, 254).toLowerCase();
	if (!EMAIL_RE.test(email)) return [{ error: 'Zkontrolujte prosím e-mail.' }, 400];

	const row = await findByEmail(env, email);
	if (row?.status === 'yes') {
		await sendMail(env, email, `Odhlášení: ${EVENT.title}`, [
			`Ahoj ${row.name},`,
			'',
			`přišla žádost o odhlášení z akce ${EVENT.title}. Odhlásit se jde tady:`,
			cancelUrl(env, row.token),
			'',
			'Pokud o odhlášení nikdo nežádal, stačí tenhle e-mail ignorovat.',
			'',
			'Gisácký deník',
		]);
	}
	// Same answer whether or not the address is registered, so the endpoint can't be used to probe addresses.
	return [{ ok: true }, 200];
}

const cancelUrl = (env: Env, token: string) => `${new URL(env.SITE_URL).origin}/#odhlasit=${token}`;

async function sendMail(env: Env, to: string, subject: string, lines: string[]): Promise<boolean> {
	if (!env.RESEND_API_KEY) {
		console.warn('RESEND_API_KEY is not set, e-mail not sent');
		return false;
	}
	const response = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({ from: env.MAIL_FROM, to: [to], subject, text: lines.join('\n') }),
	});
	if (!response.ok) console.error('Resend error', response.status, await response.text());
	return response.ok;
}
