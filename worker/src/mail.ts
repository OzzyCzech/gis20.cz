// E-mails are built from a few blocks and rendered twice: as plain text and as simple HTML
// (tables and inline styles, which is what mail clients understand). Colours follow the site.

type Inline = string | { b: string };
type Link = { label: string; href: string; intro?: string; primary?: boolean };
/** Label, value and an optional link for the value. */
type Fact = [string, string, string?];

export type Block =
	| { kind: 'p'; text: Inline[] }
	| { kind: 'stamp'; text: string }
	| { kind: 'facts'; rows: Fact[] }
	| { kind: 'links'; links: Link[] }
	| { kind: 'section'; title: string; note?: string }
	| { kind: 'signature'; text: string };

export const p = (...text: Inline[]): Block => ({ kind: 'p', text });
export const stamp = (text: string): Block => ({ kind: 'stamp', text });
export const facts = (rows: Fact[]): Block => ({ kind: 'facts', rows });
export const links = (...items: Link[]): Block => ({ kind: 'links', links: items });
export const section = (title: string, note?: string): Block => ({ kind: 'section', title, note });
export const signature = (text: string): Block => ({ kind: 'signature', text });

const INK = '#1e1a16';
const SOFT = '#5a4e44';
const RED = '#c8332f';
const PAPER = '#fffdf6';
const MAP = '#edead8';
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "'Arial Narrow', Arial, Helvetica, sans-serif";

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inlineText = (parts: Inline[]) => parts.map((x) => (typeof x === 'string' ? x : x.b)).join('');
const inlineHtml = (parts: Inline[]) => parts.map((x) => (typeof x === 'string' ? esc(x) : `<strong>${esc(x.b)}</strong>`)).join('');

export function renderText(blocks: Block[]): string {
	const parts = blocks.map((block): string | null => {
		switch (block.kind) {
			case 'p':
				return inlineText(block.text);
			case 'signature':
				return block.text;
			case 'stamp':
				return null;
			case 'facts':
				return block.rows.map(([label, value, href]) => `${label}: ${value}${href ? ` (${href})` : ''}`).join('\n');
			case 'links': {
				const withIntro = block.links.some((l) => l.intro);
				const lines = block.links.map((l) => (l.intro ? `${l.intro}\n${l.href}` : `${l.label}: ${l.href}`));
				return lines.join(withIntro ? '\n\n' : '\n');
			}
			case 'section':
				return `${block.title.toUpperCase()}${block.note ? `\n${block.note}` : ''}`;
		}
	});
	// Blank lines between blocks; the signature sits right under the closing line.
	return parts.reduce<string>((out, part, i) => (part === null ? out : out ? out + (blocks[i].kind === 'signature' ? '\n' : '\n\n') + part : part), '');
}

function button(link: Link): string {
	const colours = link.primary ? `background:${RED};color:#ffffff;border:2px solid ${RED};` : `background:${PAPER};color:${INK};border:2px solid ${INK};`;
	return `<a href="${esc(link.href)}" style="display:inline-block;${colours}padding:11px 18px;margin:0 8px 8px 0;font-family:${SANS};font-size:15px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;text-decoration:none;">${esc(link.label)}</a>`;
}

function blockHtml(block: Block): string {
	switch (block.kind) {
		case 'p':
			return `<p style="margin:0 0 16px;">${inlineHtml(block.text)}</p>`;
		case 'signature':
			return `<p style="margin:0;font-style:italic;">${esc(block.text)}</p>`;
		case 'stamp':
			return `<p style="margin:4px 0 20px;"><span style="display:inline-block;border:4px double ${RED};color:${RED};padding:5px 16px;font-family:${SANS};font-size:20px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">${esc(block.text)}</span></p>`;
		case 'facts':
			return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;border-top:1px solid ${INK};border-bottom:1px solid ${INK};">${block.rows
				.map(
					([label, value, href]) =>
						`<tr><td style="padding:7px 12px 7px 0;width:56px;vertical-align:top;font-family:${SANS};font-size:13px;letter-spacing:1px;text-transform:uppercase;color:${SOFT};">${esc(label)}</td><td style="padding:7px 0;font-weight:bold;">${
							href ? `<a href="${esc(href)}" style="color:${INK};text-decoration:underline;">${esc(value)}</a>` : esc(value)
						}</td></tr>`,
				)
				.join('')}</table>`;
		case 'links':
			return `<div style="margin:0 0 16px;">${block.links
				.map((l) => (l.intro ? `<p style="margin:14px 0 6px;color:${SOFT};font-size:15px;">${esc(l.intro)}</p>${button(l)}` : button(l)))
				.join('')}</div>`;
		case 'section':
			return `<p style="margin:26px 0 2px;padding-top:14px;border-top:3px double ${INK};font-family:${SANS};font-size:14px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">${esc(block.title)}</p>${
				block.note ? `<p style="margin:0 0 4px;color:${SOFT};font-size:14px;font-style:italic;">${esc(block.note)}</p>` : ''
			}`;
	}
}

export function renderHtml(subject: string, blocks: Block[], siteUrl: string): string {
	return `<!doctype html>
<html lang="cs">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:${MAP};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${MAP};"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${PAPER};border:1px solid #d6ccb0;">
<tr><td style="padding:22px 28px 0;font-family:${SERIF};color:${INK};text-align:center;">
<div style="padding-bottom:8px;border-bottom:3px double ${INK};font-size:28px;font-weight:bold;letter-spacing:-0.5px;">Gisácký sraz</div>
</td></tr>
<tr><td style="padding:22px 28px 28px;font-family:${SERIF};font-size:17px;line-height:1.5;color:${INK};">
${blocks.map(blockHtml).join('\n')}
</td></tr>
</table>
<p style="margin:12px 0 0;font-family:${SERIF};font-size:13px;color:${SOFT};"><a href="${esc(siteUrl)}" style="color:${SOFT};">${esc(siteUrl.replace(/^https?:\/\/|\/$/g, ''))}</a></p>
</td></tr></table>
</body>
</html>`;
}
