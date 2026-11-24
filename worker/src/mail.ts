// E-mails are built from a few blocks and rendered twice: as plain text and as simple HTML
// (tables and inline styles, which is what mail clients understand). Colours follow the site.

type Inline = string | { b: string };
type Link = { label: string; href: string; primary?: boolean };
/** A labelled fact (Kdy, Kde) with an optional small link under the value, e.g. to the calendar or the map. */
type Fact = { label: string; value: string; action?: { label: string; href: string } };

export type Block =
	| { kind: 'p'; text: Inline[] }
	| { kind: 'note'; text: string }
	| { kind: 'facts'; rows: Fact[] }
	| { kind: 'links'; links: Link[] }
	| { kind: 'signature'; text: string };

export const p = (...text: Inline[]): Block => ({ kind: 'p', text });
/** Small grey line, e.g. a remark under the buttons. */
export const note = (text: string): Block => ({ kind: 'note', text });
export const facts = (rows: Fact[]): Block => ({ kind: 'facts', rows });
/** A row of buttons; the primary one is filled red. */
export const links = (...items: Link[]): Block => ({ kind: 'links', links: items });
export const signature = (text: string): Block => ({ kind: 'signature', text });

const INK = '#1e1a16';
const SOFT = '#5a4e44';
const RED = '#c8332f';
// White page, the letter itself on light newspaper paper (a paler tint of the site's front page).
const WHITE = '#ffffff';
const PAPER = '#f7f1e3';
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "'Arial Narrow', Arial, Helvetica, sans-serif";

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inlineText = (parts: Inline[]) => parts.map((x) => (typeof x === 'string' ? x : x.b)).join('');
const inlineHtml = (parts: Inline[]) => parts.map((x) => (typeof x === 'string' ? esc(x) : `<strong>${esc(x.b)}</strong>`)).join('');

/** Where the e-mail footer points: the site and the organisers' address. */
export type Footer = { siteUrl: string; contact: string };

const host = (siteUrl: string) => siteUrl.replace(/^https?:\/\/|\/$/g, '');

export function renderText(blocks: Block[], footer: Footer): string {
	const parts = blocks.map((block): string => {
		switch (block.kind) {
			case 'p':
				return inlineText(block.text);
			case 'note':
			case 'signature':
				return block.text;
			case 'facts':
				return block.rows.map((f) => `${f.label}: ${f.value}${f.action ? `\n${f.action.label}: ${f.action.href}` : ''}`).join('\n');
			case 'links':
				return block.links.map((l) => `${l.label}: ${l.href}`).join('\n');
		}
	});
	// Blank lines between blocks; the signature sits right under the closing line. The footer follows the usual "-- " line.
	const body = parts.reduce((out, part, i) => (out ? out + (blocks[i].kind === 'signature' ? '\n' : '\n\n') + part : part), '');
	return `${body}\n\n-- \n${host(footer.siteUrl)} | ${footer.contact}`;
}

function button(link: Link): string {
	const colours = link.primary ? `background:${RED};color:#ffffff;border:2px solid ${RED};` : `background:${PAPER};color:${INK};border:2px solid ${INK};`;
	return `<a href="${esc(link.href)}" style="display:inline-block;${colours}padding:11px 18px;margin:0 8px 8px 0;font-family:${SANS};font-size:15px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;text-decoration:none;">${esc(link.label)}</a>`;
}

function blockHtml(block: Block): string {
	switch (block.kind) {
		case 'p':
			return `<p style="margin:0 0 16px;">${inlineHtml(block.text)}</p>`;
		case 'note':
			return `<p style="margin:0 0 18px;color:${SOFT};font-size:14px;font-style:italic;">${esc(block.text)}</p>`;
		case 'signature':
			return `<p style="margin:0;font-style:italic;">${esc(block.text)}</p>`;
		case 'facts':
			return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 20px;border-top:1px solid ${INK};border-bottom:1px solid ${INK};">${block.rows
				.map(
					(f) =>
						`<tr><td style="padding:9px 12px 9px 0;width:56px;vertical-align:top;font-family:${SANS};font-size:13px;line-height:26px;letter-spacing:1px;text-transform:uppercase;color:${SOFT};">${esc(f.label)}</td><td style="padding:9px 0;"><strong>${esc(f.value)}</strong>${
							f.action ? `<br><a href="${esc(f.action.href)}" style="color:${INK};font-size:15px;text-decoration:underline;">${esc(f.action.label)}</a>` : ''
						}</td></tr>`,
				)
				.join('')}</table>`;
		case 'links':
			return `<div style="margin:0 0 8px;">${block.links.map(button).join('')}</div>`;
	}
}

export function renderHtml(subject: string, blocks: Block[], { siteUrl, contact }: Footer): string {
	const footerLink = `color:${SOFT};text-decoration:underline;`;
	return `<!doctype html>
<html lang="cs">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:${WHITE};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${WHITE};"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${PAPER};border:1px solid #d6ccb0;">
<tr><td style="padding:22px 28px 0;font-family:${SERIF};color:${INK};text-align:center;">
<div style="padding-bottom:8px;border-bottom:3px double ${INK};font-size:28px;font-weight:bold;letter-spacing:-0.5px;"><a href="${esc(siteUrl)}" style="color:${INK};text-decoration:none;">Gisácký sraz</a></div>
</td></tr>
<tr><td style="padding:22px 28px 28px;font-family:${SERIF};font-size:17px;line-height:1.5;color:${INK};">
${blocks.map(blockHtml).join('\n')}
</td></tr>
</table>
<p style="margin:12px 0 0;font-family:${SERIF};font-size:13px;color:${SOFT};"><a href="${esc(siteUrl)}" style="${footerLink}">${esc(host(siteUrl))}</a> | <a href="mailto:${esc(contact)}" style="${footerLink}">${esc(contact)}</a></p>
</td></tr></table>
</body>
</html>`;
}
