// The whole gis20.cz site: static Astro build (ASSETS) plus the RSVP API under /api/
// (answer coming / not coming, change the answer via a personal link, head count, attendance sheet).
// Data lives in D1 (see ../schema.sql); e-mails go out through Resend.
// Publicly the API only returns a count. Names are listed only for a registrant's personal sheet link,
// and e-mail addresses, phones and notes never leave the database.

import { answerMail, type Guest, linksMail, type Mail, type Status } from './emails.ts';
import { renderHtml, renderText } from './mail.ts';

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

type Registration = { id: number; email: string; name: string; status: Status; token: string; view_token: string | null };

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
		// Build output under /_astro/ has content hashes in its names, so browsers may keep it for good.
		if (url.pathname.startsWith('/_astro/') && asset.ok) response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
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
			if (pathname === '/answer') return json(...(await answer(env, data)));
			if (pathname === '/answer-link') return json(...(await answerLink(env, data)));
			if (pathname === '/attendees') return json(...(await attendees(env, data)));
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
const newToken = () => crypto.randomUUID().replace(/-/g, '');

async function count(env: Env): Promise<number> {
	const row = await env.DB.prepare("SELECT COUNT(*) AS n FROM registrations WHERE status = 'yes'").first<{ n: number }>();
	return row?.n ?? 0;
}

async function findByEmail(env: Env, email: string) {
	return env.DB.prepare('SELECT id, email, name, status, token, view_token FROM registrations WHERE email = ?').bind(email).first<Registration>();
}

async function register(env: Env, data: Record<string, unknown>): Promise<[unknown, number]> {
	// Honeypot: humans never see the field, bots fill it in. Pretend success.
	if (text(data.hp_check, 200)) return [{ ok: true, mailed: false }, 200];

	const status: Status = data.attending === 'no' ? 'no' : 'yes';
	const name = text(data.name, 80);
	const email = text(data.email, 254).toLowerCase();
	const phone = text(data.phone, 24);
	const note = text(data.note, 500);
	if (name.length < 2) return [{ error: 'Vyplňte prosím jméno.' }, 400];
	// The name ends up in e-mails and on the attendance sheet; keep links and markup out of it.
	if (/https?:|www\.|[<>/@]/i.test(name)) return [{ error: 'Jméno obsahuje nepovolené znaky.' }, 400];
	if (!EMAIL_RE.test(email)) return [{ error: 'Zkontrolujte prosím e-mail.' }, 400];
	if (!PHONE_RE.test(phone.replace(/[\s()-]/g, ''))) return [{ error: 'Zkontrolujte prosím telefon.' }, 400];

	const existing = await findByEmail(env, email);
	let token: string;
	let viewToken: string;
	if (existing) {
		token = existing.token;
		viewToken = existing.view_token ?? newToken();
		await env.DB.prepare(
			'UPDATE registrations SET name = ?, phone = ?, note = ?, status = ?, view_token = ?, updated_at = ?, cancelled_at = NULL WHERE id = ?',
		)
			.bind(name, phone, note, status, viewToken, now(), existing.id)
			.run();
	} else {
		token = newToken();
		viewToken = newToken();
		const at = now();
		await env.DB.prepare(
			'INSERT INTO registrations (email, name, phone, note, status, token, view_token, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
		)
			.bind(email, name, phone, note, status, token, viewToken, at, at)
			.run();
	}

	const mailed = await sendAnswerMail(env, { email, name, status, token, view_token: viewToken });
	return [{ ok: true, mailed, status, count: await count(env) }, 200];
}

// The personal answer link works both ways: coming and not coming are equally valid answers.
// Without `attending` it only reports the current answer.
async function answer(env: Env, data: Record<string, unknown>): Promise<[unknown, number]> {
	const token = text(data.token, 64);
	const row = token
		? await env.DB.prepare('SELECT id, email, name, status, token, view_token FROM registrations WHERE token = ?').bind(token).first<Registration>()
		: null;
	if (!row) return [{ error: 'Odkaz na změnu odpovědi není platný.' }, 404];

	const viewToken = await ensureViewToken(env, row);
	const wanted = data.attending === 'yes' || data.attending === 'no' ? (data.attending as Status) : null;
	let mailed = false;
	if (wanted && wanted !== row.status) {
		const at = now();
		await env.DB.prepare('UPDATE registrations SET status = ?, updated_at = ?, cancelled_at = ? WHERE id = ?')
			.bind(wanted, at, wanted === 'no' ? at : null, row.id)
			.run();
		mailed = await sendAnswerMail(env, { ...row, status: wanted, view_token: viewToken });
		row.status = wanted;
	}
	// The answer link is the stronger of the two, so its holder may also get the sheet link.
	return [{ ok: true, name: row.name, coming: row.status === 'yes', sheet: viewToken, mailed, count: await count(env) }, 200];
}

async function answerLink(env: Env, data: Record<string, unknown>): Promise<[unknown, number]> {
	const email = text(data.email, 254).toLowerCase();
	if (!EMAIL_RE.test(email)) return [{ error: 'Zkontrolujte prosím e-mail.' }, 400];

	const row = await findByEmail(env, email);
	if (row) {
		const viewToken = await ensureViewToken(env, row);
		await sendMail(env, email, linksMail(env.SITE_URL, { ...row, view_token: viewToken }));
	}
	// Same answer whether or not the address is registered, so the endpoint can't be used to probe addresses.
	return [{ ok: true }, 200];
}

// Rows created before the sheet existed may lack a view token; give them one on first use.
async function ensureViewToken(env: Env, row: Registration): Promise<string> {
	if (row.view_token) return row.view_token;
	const viewToken = newToken();
	await env.DB.prepare('UPDATE registrations SET view_token = ? WHERE id = ?').bind(viewToken, row.id).run();
	row.view_token = viewToken;
	return viewToken;
}

// Confirmation after every answer or change; the texts are in emails.ts.
function sendAnswerMail(env: Env, guest: Guest & { email: string }): Promise<boolean> {
	return sendMail(env, guest.email, answerMail(env.SITE_URL, guest));
}

async function attendees(env: Env, data: Record<string, unknown>): Promise<[unknown, number]> {
	const token = text(data.token, 64);
	const viewer = token ? await env.DB.prepare('SELECT id FROM registrations WHERE view_token = ?').bind(token).first<{ id: number }>() : null;
	if (!viewer) return [{ error: 'Odkaz na prezenční listinu není platný.' }, 404];

	const { results } = await env.DB.prepare('SELECT id, name, status FROM registrations ORDER BY created_at, id').all<{
		id: number;
		name: string;
		status: Status;
	}>();
	// Names and answers only; the viewer's own row is flagged so the sheet can highlight it.
	return [{ people: results.map((row) => ({ name: row.name, coming: row.status === 'yes', you: row.id === viewer.id })) }, 200];
}

async function sendMail(env: Env, to: string, { subject, blocks }: Mail): Promise<boolean> {
	if (!env.RESEND_API_KEY) {
		console.warn('RESEND_API_KEY is not set, e-mail not sent');
		return false;
	}
	// The footer's contact is the sender address itself (MAIL_FROM is "Name <address>").
	const footer = { siteUrl: env.SITE_URL, contact: env.MAIL_FROM.match(/<(.+)>/)?.[1] ?? env.MAIL_FROM };
	const response = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({ from: env.MAIL_FROM, to: [to], subject, text: renderText(blocks, footer), html: renderHtml(subject, blocks, footer) }),
	});
	if (!response.ok) console.error('Resend error', response.status, await response.text());
	return response.ok;
}
