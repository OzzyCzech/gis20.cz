// Local preview of every RSVP e-mail, rendered by the same code the Worker sends them with
// (texts in worker/src/emails.ts, layout in worker/src/mail.ts), as HTML and as the plain-text part.
// `npm run mail:preview` serves it at http://localhost:4322; node --watch restarts it on every change,
// so after editing a text just reload the page.

import { createServer } from 'node:http';
import { answerMail, type Guest, linksMail, type Mail } from '../worker/src/emails.ts';
import { renderHtml, renderText } from '../worker/src/mail.ts';

const PORT = 4322;
const footer = { siteUrl: 'https://gis20.cz/', contact: 'sraz@gis20.cz' };
const SITE_URL = footer.siteUrl;
const guest: Guest = {
	name: 'Diego Nepřišel',
	status: 'yes',
	token: '0123456789abcdef0123456789abcdef',
	view_token: 'fedcba9876543210fedcba9876543210',
};

const mails: [string, Mail][] = [
	['Přihláška: přijedu', answerMail(SITE_URL, guest)],
	['Přihláška: nepřijedu', answerMail(SITE_URL, { ...guest, status: 'no' })],
	['Znovu poslané odkazy', linksMail(SITE_URL, guest)],
];

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const sections = mails.map(
	([title, { subject, blocks }], i) => `
<section id="m${i}">
	<h2>${esc(title)} <small>Předmět: ${esc(subject)}</small></h2>
	<div class="row">
		<iframe title="${esc(title)}" srcdoc="${esc(renderHtml(subject, blocks, footer))}"
			onload="this.style.height = this.contentDocument.documentElement.scrollHeight + 'px'"></iframe>
		<pre>${esc(renderText(blocks, footer))}</pre>
	</div>
</section>`,
);

const page = `<!doctype html>
<html lang="cs">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Náhled e-mailů</title>
<style>
	body { margin: 0; font: 15px/1.4 system-ui, sans-serif; color: #222; background: #f3f3f3; }
	nav { position: sticky; top: 0; z-index: 1; display: flex; flex-wrap: wrap; gap: 16px; padding: 12px 24px; background: #fff; border-bottom: 1px solid #ddd; }
	section { padding: 24px; border-bottom: 1px solid #ddd; }
	h2 { margin: 0 0 12px; font-size: 17px; }
	small { margin-left: 8px; font-weight: normal; color: #666; }
	.row { display: flex; flex-wrap: wrap; gap: 24px; align-items: flex-start; }
	iframe { width: 640px; max-width: 100%; border: 1px solid #ccc; background: #fff; }
	pre { flex: 1; min-width: 300px; margin: 0; padding: 16px; white-space: pre-wrap; background: #fff; border: 1px solid #ccc; font: 13px/1.5 ui-monospace, monospace; }
</style>
<nav><strong>Náhled e-mailů</strong>${mails.map(([title], i) => `<a href="#m${i}">${esc(title)}</a>`).join('')}<span>(vlevo HTML, vpravo textová verze)</span></nav>
${sections.join('\n')}
</html>`;

createServer((_, response) => {
	response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
	response.end(page);
}).listen(PORT, () => console.log(`Náhled e-mailů: http://localhost:${PORT}`));
