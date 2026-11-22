// Fake newspaper scraps scattered over the map in the "Z archivu" section.
// Edit freely: dates only where the event really happened then; mastheads are fictional.

export type ClippingArt = 'wine' | 'salami' | 'globe' | 'puck' | 'floppy' | 'satellite' | 'pole' | 'swatch';

export type Clipping = {
	kind: 'news' | 'ad' | 'classified';
	kicker: string;
	headline: string;
	/** Subheadline under the headline. */
	deck?: string;
	body: string;
	masthead?: string;
	date?: string;
	footer?: string | string[];
	art?: ClippingArt;
	/** Printed copy of an e-mail, shown after `body`; `after` continues below it (trusted HTML, e.g. <b>). */
	facsimile?: { from?: string; subject: string; text: string[] };
	after?: string;
	/**
	 * Photo from src/assets/clippings/; skipped if the file is missing.
	 * `width` is % of the clipping width (default 100).
	 * `scale` draws a ruler under it: from/to are % of the photo width for 0 and 1 unit.
	 */
	image?: { file: string; alt: string; caption?: string; width?: number; scale?: { from: number; to: number; unit: string } };
};

export const clippings: Clipping[] = [
	{
		kind: 'news',
		masthead: 'Gisácký deník',
		kicker: 'Věda',
		headline: 'Vysočiny mám po krk!',
		body: 'Salám Vysočina se stal neoficiální měrnou jednotkou hloubky. Sérií praktických pokusů bylo zjištěno, kam až je možné zajít. Výsledky se mezi jednotlivci výrazně lišily.',
		footer: 'Hodí se k ArcView nebo pivu.',
		image: {
			file: 'salam-vysocina.jpg',
			alt: 'Salám Vysočina s odkrojenými plátky',
			width: 65,
		},
	},
	{
		kind: 'news',
		masthead: 'Gisácký deník',
		kicker: 'Kultura',
		headline: 'Studenti založili punkovou skupinu Karpílní tunely',
		body: 'Na prvním koncertu ve Vrtačce zazněly pecky jako Topologická chyba, Křovákova deformace, Souřadnice vzpoury, Šikmá konformita, Ortogonální odpor nebo Geodetická anarchie.',
		image: {
			file: 'bratri-v-kliku.png',
			alt: 'Potisk trička: tři kreslení kluci v objetí, na tričkách nápis GIS, pod nimi Bratři v Kliku',
			caption: 'Kapela vystupuje výhradně v tričkách Bratři v Kliku.',
		},
	},
	{
		kind: 'news',
		masthead: 'Gisácký deník',
		kicker: 'Školství',
		headline: 'Konečně hotovo!',
		body: 'Student odevzdal semestrálku z PAD, která měla 80 stran a 14 map. Po měsíci čekání přišla ve 2:45 ráno laxní odpověď:',
		after: 'ok. <b>J</b>si <b>H</b>otov!',
		facsimile: {
			subject: 'Re: Prostorová analýza dat – odevzdání',
			text: ['ok', 'JH'],
		},
	},
	{
		kind: 'news',
		masthead: 'Gisácký deník',
		kicker: 'Černá kronika',
		headline: 'Ztracen v Sherwoodu',
		body: 'Známý pedagog se cestou z nechvalně proslulé Myslivny ztratil v lese přilehlém ke kolejím. Orientační schopnosti geoinformatika tentokrát selhaly.',
	},
	{
		kind: 'classified',
		kicker: 'Ztráty a nálezy',
		headline: 'Hledá se disketa',
		body: 'Ztratila se 3,5″ disketa s nastavením digitizéru, poctivému nálezci děkuje pan doktor Tomáš P.',
		footer: 'Zn.: Bez diskety to nejede.',
		art: 'floppy',
	},
	{
		kind: 'news',
		masthead: 'Gisácký deník',
		kicker: 'Černá kronika',
		headline: 'Otevíral pivo výtyčkou',
		body: 'Nejmenovaný student geoinformatiky otevíral na měření pivo výtyčkou. Podle svědků proběhlo měření bez závad, láhev nebyla poškozená a tento úkon neměl na výsledky měření vliv.',
		art: 'pole',
	},
	{
		kind: 'news',
		masthead: 'Gisácký deník',
		kicker: 'Kartografie',
		headline: 'Ta hnědá je málo hnědá!',
		body: 'Student utratil všechny peníze, které měl uložené stranou na alkohol, za tisk vrstevnic na A3 pauzovací papír a nakonec docentce nebyla hnědá barva dost hnědá!',
		footer: 'Tak řekni, že ses splet',
		art: 'swatch',
	},
	{
		kind: 'news',
		kicker: 'Software',
		headline: 'ArcView opět nereaguje',
		body: 'Neuložený projekt je nenávratně ztracen. Vyučující David V. doporučuje vytvořit si kompulzivní návyk mačkat Ctrl+S každých 10 sekund.',
		footer: 'Já si to neuložil!',
	},
	{
		kind: 'news',
		masthead: 'Gisácký deník',
		kicker: 'Terénní cvičení',
		headline: 'GPS hledá družice už třetí hodinu',
		body: 'Podle neoficiálních informací se skupina nachází někde mezi dvěma vrstevnicemi. Svačina došla v 9:15.',
		art: 'satellite',
	},
	{
		kind: 'news',
		masthead: 'Gisácký deník',
		kicker: 'Studentský život',
		headline: 'Sejdeme se na C6',
		body: 'Na skutečný život připravily studenty především přednášky a semináře v C6. Účast byla dobrovolná, docházka rekordní.',
		footer: 'Zipe, platíš deset!',
	},
];
