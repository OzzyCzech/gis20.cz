// What every RSVP e-mail says, as blocks for mail.ts. Pure functions of the guest and the site URL, without the
// Worker's runtime, so `npm run mail:preview` renders exactly these texts locally (scripts/mail-preview.ts).
// Classmates write to each other informally (tykání); the texts avoid gendered verb forms and the vocative,
// since the name field can hold anything from a full name to a nickname.

import { type Block, facts, links, note, p, signature } from './mail.ts';

export type Status = 'yes' | 'no';
export type Mail = { subject: string; blocks: Block[] };
/** What an e-mail needs to know about the guest: the name, the answer and both personal tokens. */
export type Guest = { name: string; status: Status; token: string; view_token: string };

const EVENT = {
	when: '19.–20. června 2027',
	place: 'vinný sklep, Dolní Bojanovice',
	// Same map link as on the site (mapLinks in src/data/event.ts).
	map: 'https://mapy.com/fnc/v1/showmap?mapset=outdoor&center=17.0220803,48.8625189&zoom=17&marker=true',
};
const SIGNATURE = 'Igor, Zip, Maja, Vojta, Mini, Ozzy, Lenka a všichni ostatní';

const origin = (siteUrl: string) => new URL(siteUrl).origin;
const answerUrl = (siteUrl: string, token: string) => `${origin(siteUrl)}/#odpoved=${token}`;
const sheetUrl = (siteUrl: string, token: string) => `${origin(siteUrl)}/#listina=${token}`;

// Both personal links only ever travel by e-mail, so knowing someone's address is not enough to change
// their answer or to read the sheet. One sentence above them, both buttons side by side, a remark under them.
const personalLinks = (siteUrl: string, guest: Guest, intro: string): Block[] => [
	p(intro),
	links(
		{ label: 'Prezenční listina', href: sheetUrl(siteUrl, guest.view_token), primary: true },
		{ label: 'Změnit odpověď', href: answerUrl(siteUrl, guest.token) },
	),
	note('Odkazy jsou jen pro tebe, prosím nikomu je neposílej.'),
];

/** Confirmation after every answer or change of answer. */
export function answerMail(siteUrl: string, guest: Guest): Mail {
	if (guest.status === 'yes') {
		return {
			subject: 'Sraz gisáků: počítáme s tebou!',
			blocks: [
				p('Ahoj,'),
				p('paráda, že dorazíš! Budeme s tebou počítat.'),
				facts([
					{ label: 'Kdy', value: EVENT.when, action: { label: 'Uložit do kalendáře', href: new URL('sraz.ics', siteUrl).href } },
					{ label: 'Kde', value: EVENT.place, action: { label: 'Ukázat na mapě', href: EVENT.map } },
				]),
				...personalLinks(
					siteUrl,
					guest,
					'Kdo další přijede, uvidíš na prezenční listině. A kdyby se ti do toho něco připletlo, odpověď můžeš ještě změnit.',
				),
				p('Těšíme se na tebe!'),
				signature(SIGNATURE),
			],
		};
	}
	return {
		subject: 'Sraz gisáků: škoda, že to nevyjde',
		blocks: [
			p('Ahoj,'),
			p('díky za odpověď. Škoda, že to nevyjde, budeš chybět! Omluvenku máme zapsanou pod jménem ', { b: guest.name }, '.'),
			...personalLinks(siteUrl, guest, 'Kdo přijede, uvidíš na prezenční listině. A kdyby to nakonec vyšlo, odpověď můžeš ještě změnit.'),
			signature(SIGNATURE),
		],
	};
}

/** Sent when someone asks for their links again on the slip ("Změnily se plány?"). */
export function linksMail(siteUrl: string, guest: Guest): Mail {
	return {
		subject: 'Sraz gisáků: tvoje odkazy',
		blocks: [
			p('Ahoj,'),
			p('přišla nám žádost o odkazy k přihlášce na sraz pod jménem ', { b: guest.name }, '.'),
			...personalLinks(siteUrl, guest, 'Na prezenční listině uvidíš, kdo přijede, a odpověď můžeš kdykoli změnit.'),
			p('Pokud to nebyl tvůj požadavek, stačí tenhle e-mail ignorovat. Odpověď zůstává, jak byla.'),
			signature(SIGNATURE),
		],
	};
}
