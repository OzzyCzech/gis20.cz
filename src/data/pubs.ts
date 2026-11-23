// Pubs from student days, drawn as quiet map symbols on the background tile.
// Positions are fictional, in tile units (0–1), chosen to sit clear of the road,
// river, trail and spot heights; keep labels away from the tile edges so they don't get cut at the seam.

export type PubKind = 'pub' | 'bar' | 'hut';

export type Pub = { name: string; kind: PubKind; x: number; y: number };

export const pubs: Pub[] = [
	{ name: 'Vzpomínka', kind: 'pub', x: 0.467, y: 0.088 },
	{ name: 'Bar Mukade', kind: 'bar', x: 0.825, y: 0.358 },
	{ name: 'Hitler', kind: 'pub', x: 0.1, y: 0.492 },
	{ name: 'Panoramka', kind: 'pub', x: 0.842, y: 0.575 },
	{ name: 'U Dudáka', kind: 'pub', x: 0.483, y: 0.375 },
	{ name: 'Nonstop', kind: 'pub', x: 0.192, y: 0.75 },
	{ name: 'Zwettler', kind: 'pub', x: 0.667, y: 0.467 },
	{ name: 'Bufet Kruhovka', kind: 'pub', x: 0.517, y: 0.925 },
	{ name: 'Krystýna', kind: 'hut', x: 0.138, y: 0.342 },
];
