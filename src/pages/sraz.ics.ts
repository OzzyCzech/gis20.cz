import type { APIRoute } from 'astro';
import { event, formatCzk, mapLinks, promotionYear } from '../data/event';

// Static iCalendar file so guests can add the event with one click.

const pad = (n: number) => String(n).padStart(2, '0');
const icsDate = (y: number, m: number, d: number) => {
	const date = new Date(Date.UTC(y, m - 1, d));
	return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;
};
const escape = (text: string) => text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

// RFC 5545: lines longer than 75 octets must be folded.
function fold(line: string): string {
	const encoder = new TextEncoder();
	const parts: string[] = [];
	let current = '';
	for (const char of line) {
		const limit = parts.length === 0 ? 75 : 74;
		if (encoder.encode(current + char).length > limit) {
			parts.push(current);
			current = char;
		} else {
			current += char;
		}
	}
	parts.push(current);
	return parts.join('\r\n ');
}

export const GET: APIRoute = ({ site }) => {
	const url = site?.href ?? '';
	const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
	const { start, end } = event;
	const { lat, lon } = event.venueCoords;
	const place = `${event.venue}, ${event.town}`;

	const description = [
		`${event.yearsSince} let od promocí (${promotionYear}) – obor ${event.field}, ${event.school}.`,
		`Cena: ${formatCzk(event.price).replace(/\u00A0/g, ' ')} (${event.priceIncludes}).`,
		`Mapa: ${mapLinks(event.venueCoords).mapy}`,
		url,
	]
		.filter(Boolean)
		.join('\n');

	const lines = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//Sraz GIS VSB-TUO//pozvanka//CS',
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		'BEGIN:VEVENT',
		`UID:sraz-gis-vsb-tuo-${icsDate(start.y, start.m, start.d)}`,
		`DTSTAMP:${stamp}`,
		`DTSTART;VALUE=DATE:${icsDate(start.y, start.m, start.d)}`,
		// All-day DTEND is exclusive, so it is the day after the last day.
		`DTEND;VALUE=DATE:${icsDate(end.y, end.m, end.d + 1)}`,
		`SUMMARY:${escape(event.title)}`,
		`LOCATION:${escape(place)}`,
		// Standard coordinates, plus Apple's variant that makes Apple Calendar show a map pin.
		`GEO:${lat};${lon}`,
		`X-APPLE-STRUCTURED-LOCATION;VALUE=URI;X-APPLE-RADIUS=50;X-TITLE="${place}":geo:${lat},${lon}`,
		`DESCRIPTION:${escape(description)}`,
		...(url ? [`URL:${url}`] : []),
		'END:VEVENT',
		'END:VCALENDAR',
	];

	return new Response(lines.map(fold).join('\r\n') + '\r\n', {
		headers: { 'Content-Type': 'text/calendar; charset=utf-8' },
	});
};
