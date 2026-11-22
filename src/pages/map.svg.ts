import type { APIRoute } from 'astro';
import { mapSvg } from '../lib/contours';

// Prerendered seamless map tile used as the page background.
export const GET: APIRoute = () =>
	new Response(mapSvg({ size: 1200, cell: 12, levels: 22, indexEvery: 5 }), {
		headers: { 'Content-Type': 'image/svg+xml' },
	});
