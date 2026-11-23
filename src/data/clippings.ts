// Fake newspaper scraps scattered over the map in the "Z archivu" section.
// Edit freely: dates only where the event really happened then; mastheads are fictional.

export type ClippingArt = 'wine' | 'salami' | 'globe' | 'puck' | 'floppy' | 'satellite' | 'pole' | 'swatch' | 'fire';

export type Clipping = {
	kind: 'news' | 'ad' | 'classified';
	kicker: string;
	headline: string;
	/** Subheadline under the headline. */
	deck?: string;
	/** Optional for a song, which has `lyrics` instead. */
	body?: string;
	/** Song lyrics, one line per item, printed in italics after `body`. */
	lyrics?: string[];
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
		kicker: 'Kultura',
		headline: 'Studenti založili punkovou skupinu Karpální tunely',
		body: 'Na prvním koncertu ve Vrtačce zazněly pecky jako Topologická chyba, Křovákova deformace, Souřadnice vzpoury, Šikmá konformita, Ortogonální odpor nebo Geodetická anarchie.',
		footer: 'Bratři v Kliku.',
		image: {
			file: 'bratri-v-kliku.png',
			alt: 'Potisk trička: tři kreslení kluci v objetí, na tričkách nápis GIS, pod nimi Bratři v Kliku',
			caption: 'Kapela vystupuje výhradně v tričkách Bratři v Kliku.',
		},
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
		kicker: 'Černá kronika',
		headline: 'Otevíral pivo výtyčkou',
		body: 'Nejmenovaný student geoinformatiky otevíral na měření pivo výtyčkou. Podle svědků proběhlo měření bez závad, láhev nebyla poškozená a tento úkon neměl na výsledky měření vliv.',
		footer: 'Pivo otevřu čímkoliv.',
		art: 'pole',
	},
	{
		kind: 'news',
		kicker: 'Školství',
		headline: 'Konečně hotovo!',
		body: 'Student odevzdal semestrálku z PAD, která měla 80 stran a 14 map. Po měsíci čekání přišla ve 2:45 ráno laxní odpověď:',
		facsimile: {
			subject: 'Re: Prostorová analýza dat – odevzdání',
			text: ['DD,', 'ok', 'JH'],
		},
		footer: 'Díky, Jirko!',
	},
	{
		kind: 'news',
		kicker: 'Černá kronika',
		headline: 'Ztracen v Sherwoodu',
		body: 'Známý pedagog se cestou z nechvalně proslulé Myslivny ztratil v lese přilehlém ke kolejím. Orientační schopnosti geoinformatika tentokrát selhaly.',
		footer: 'Měl jsem zůstat u Linuxu.',
	},
	{
		kind: 'news',
		kicker: 'Černá kronika',
		headline: 'Shořely mu boty!',
		body: 'Poškozený musel zhruba dvoukilometrovou cestu absolvovat bos. Pachatel zůstává neznámý, vyšetřování komplikuje nedostatek střízlivých svědků.',
		footer: 'P...a plus deset.',
		art: 'fire',
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
		kicker: 'Kartografie',
		headline: 'Ta hnědá je málo hnědá!',
		body: 'Student utratil všechny peníze, které měl uložené stranou na alkohol, za tisk vrstevnic na A3 pauzovací papír a nakonec docentce nebyla hnědá barva dost hnědá!',
		footer: 'Tak řekni, že ses spletl.',
		art: 'swatch',
	},
	{
		kind: 'news',
		kicker: 'Studentský život',
		headline: 'Sejdeme se na C6',
		body: 'Na skutečný život připravily studenty především přednášky a semináře v C6. Účast byla dobrovolná, docházka rekordní.',
		footer: 'Zipe, platíš deset!',
	},
	{
		kind: 'news',
		kicker: 'Zpěvník',
		headline: 'Povrchový důl',
		lyrics: ['Nejkrásnější věc na světě', 'je povrchový důl, jooo povrchový důl…', 'Joooo povrchový důl!'],
	},
	{
		kind: 'news',
		kicker: 'Terénní cvičení',
		headline: 'Topcon GPS hledá signál už třetí hodinu',
		body: 'Skupinka deseti studentů se už třetí hodinu marně snaží ulovit signál GPS na přístroji značky Topcon. Svačina došla v 9:15, zásoby alkoholu jsou zatím dostačující.',
		footer: 'Pak to naklikáme v ArcGISu.',
		art: 'satellite',
	},
	{
		kind: 'news',
		kicker: 'Věda',
		headline: 'Vysočiny mám po krk!',
		body: 'Salám Vysočina se stal neoficiální měrnou jednotkou hloubky. Sérií praktických pokusů bylo zjištěno, kam až je možné zajít. Výsledky se mezi jednotlivci výrazně lišily.',
		footer: 'Hlavně nepolykat!',
		image: {
			file: 'salam-vysocina.jpg',
			alt: 'Salám Vysočina s odkrojenými plátky',
			width: 65,
		},
	},
	{
		kind: 'news',
		kicker: 'Černá kronika',
		headline: 'Nechal otevřeno',
		body: 'Student oslavil Den dětí otevřenými dveřmi učebny J339. Neznámý pachatel příležitosti využil a odnesl si na oslavu projektor za 60 tisíc korun.',
		footer: 'Hej, tak to jsem v prdeli.',
	},
];
