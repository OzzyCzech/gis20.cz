// Single source of truth for all event facts shown on the site.
// Optional fields render nothing on the page while they stay empty.

export type LatLon = { lat: number; lon: number };

export const event = {
	title: 'Sraz gisáků po 20 letech',
	school: 'VŠB – Technická univerzita Ostrava',
	schoolLocative: 'VŠB – Technické univerzitě Ostrava', // "na …"
	schoolShort: 'VŠB-TUO',
	field: 'GIS',
	yearsSince: 20,

	// Local calendar dates (year, month 1–12, day). End date is inclusive.
	start: { y: 2027, m: 6, d: 19 },
	end: { y: 2027, m: 6, d: 20 },

	venue: 'Vinný sklep',
	town: 'Dolní Bojanovice',

	price: 1100,
	priceIncludes: 'víno + jídlo',

	// The wine cellar itself (Mapy.com).
	venueCoords: { lat: 48.8625189, lon: 17.0220803 } satisfies LatLon,
	// VŠB-TUO campus in Ostrava-Poruba, from OpenStreetMap (Nominatim).
	schoolCoords: { lat: 49.83385, lon: 18.1647 } satisfies LatLon,

	// RSVP API served by the same Cloudflare Worker as the site (worker/src/index.ts), e.g. '/api'.
	// Leave empty to hide the RSVP slip in production (hidden until confirmation e-mails work).
	rsvpApi: '',
	// Optional extras shown on the RSVP slip.
	contactEmail: '',
	contactPhone: '',
	rsvpDeadline: '', // free text, e.g. '31. 3. 2027'
	paymentInfo: '', // free text, e.g. account number + variable symbol
};

export const promotionYear = event.start.y - event.yearsSince;

/** Great-circle distance in kilometres (haversine, mean Earth radius). */
export function distanceKm(a: LatLon, b: LatLon): number {
	const R = 6371.0088;
	const toRad = (deg: number) => (deg * Math.PI) / 180;
	const dLat = toRad(b.lat - a.lat);
	const dLon = toRad(b.lon - a.lon);
	const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
	return 2 * R * Math.asin(Math.sqrt(h));
}

const NBSP = ' ';

/** "1 100 Kč" with non-breaking spaces. */
export function formatCzk(amount: number): string {
	return amount.toLocaleString('cs-CZ').replace(/\s/g, NBSP) + NBSP + 'Kč';
}

/** "19.–20. 6. 2027" with non-breaking spaces (same month and year assumed). */
export function formatDateRange(): string {
	const { start, end } = event;
	return `${start.d}.–${end.d}.${NBSP}${start.m}.${NBSP}${start.y}`;
}

/** "19.–20. června 2027" (genitive month name, non-breaking spaces). */
export function formatDateRangeLong(): string {
	const { start, end } = event;
	const month = new Date(start.y, start.m - 1, start.d).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long' }).split(' ')[1];
	return `${start.d}.–${end.d}.${NBSP}${month}${NBSP}${start.y}`;
}

/** Weekday names computed from the dates, e.g. "sobota–neděle". */
export function formatWeekdays(): string {
	const day = (p: { y: number; m: number; d: number }) =>
		new Date(p.y, p.m - 1, p.d).toLocaleDateString('cs-CZ', { weekday: 'long' });
	return `${day(event.start)}–${day(event.end)}`;
}

/** Decimal degrees with hemisphere, e.g. "48.8586° N". */
export function formatCoord(value: number, axis: 'lat' | 'lon', digits = 4): string {
	const hemi = axis === 'lat' ? (value >= 0 ? 'N' : 'S') : value >= 0 ? 'E' : 'W';
	return `${Math.abs(value).toFixed(digits)}°${NBSP}${hemi}`;
}

export function mapLinks({ lat, lon }: LatLon) {
	return {
		mapy: `https://mapy.com/fnc/v1/showmap?mapset=outdoor&center=${lon},${lat}&zoom=17&marker=true`,
		osm: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=17/${lat}/${lon}`,
	};
}

