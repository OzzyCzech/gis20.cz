// Generates real isolines (marching squares) over a synthetic terrain,
// so the page background looks like an actual topographic map sheet.

type Point = [number, number];

export type MapOptions = {
	size: number; // square tile edge in px
	cell: number;
	levels: number;
	indexEvery: number; // every n-th line is a thicker "index contour"
};

// Hill centres and noise are periodic over the unit square, so the generated
// map tiles seamlessly when repeated as a background.
const hills = [
	{ x: 0.2, y: 0.25, h: 1.0, s: 0.13 },
	{ x: 0.72, y: 0.18, h: 0.8, s: 0.11 },
	{ x: 0.56, y: 0.7, h: 1.1, s: 0.15 },
	{ x: 0.1, y: 0.78, h: 0.6, s: 0.1 },
	{ x: 0.9, y: 0.58, h: 0.7, s: 0.1 },
];

const TAU = Math.PI * 2;

function terrain(nx: number, ny: number): number {
	let z = 0;
	for (const hill of hills) {
		// Periodic stand-in for distance: smooth across the tile seam.
		const sx = Math.sin(Math.PI * (nx - hill.x)) / Math.PI;
		const sy = Math.sin(Math.PI * (ny - hill.y)) / Math.PI;
		z += hill.h * Math.exp(-(sx * sx + sy * sy) / (2 * hill.s * hill.s));
	}
	z += 0.06 * Math.sin(TAU * 2 * nx + 1.3) * Math.cos(TAU * ny - 0.4);
	z += 0.04 * Math.sin(TAU * (3 * nx + 2 * ny) + 0.8);
	z += 0.03 * Math.cos(TAU * (5 * nx - 4 * ny));
	return z;
}

// Segment table: corners tl, tr, br, bl -> edges 0 top, 1 right, 2 bottom, 3 left.
const CASES: Record<number, [number, number][]> = {
	1: [[3, 2]],
	2: [[2, 1]],
	3: [[3, 1]],
	4: [[0, 1]],
	5: [
		[3, 0],
		[2, 1],
	],
	6: [[0, 2]],
	7: [[3, 0]],
	8: [[3, 0]],
	9: [[0, 2]],
	10: [
		[0, 1],
		[3, 2],
	],
	11: [[0, 1]],
	12: [[3, 1]],
	13: [[2, 1]],
	14: [[3, 2]],
};

const key = (p: Point) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`;

function isolines(grid: number[][], level: number, cell: number): Point[][] {
	const rows = grid.length - 1;
	const cols = grid[0].length - 1;
	const segments: [Point, Point][] = [];

	// Horizontal edges interpolate left->right, vertical top->bottom, so shared
	// edges of neighbouring cells produce identical points.
	const lerp = (a: number, b: number) => (level - a) / (b - a);

	for (let j = 0; j < rows; j++) {
		for (let i = 0; i < cols; i++) {
			const tl = grid[j][i];
			const tr = grid[j][i + 1];
			const br = grid[j + 1][i + 1];
			const bl = grid[j + 1][i];
			const idx = (tl >= level ? 8 : 0) | (tr >= level ? 4 : 0) | (br >= level ? 2 : 0) | (bl >= level ? 1 : 0);
			const pairs = CASES[idx];
			if (!pairs) continue;

			const x = i * cell;
			const y = j * cell;
			const edge = (e: number): Point => {
				switch (e) {
					case 0:
						return [x + lerp(tl, tr) * cell, y];
					case 1:
						return [x + cell, y + lerp(tr, br) * cell];
					case 2:
						return [x + lerp(bl, br) * cell, y + cell];
					default:
						return [x, y + lerp(tl, bl) * cell];
				}
			};
			for (const [a, b] of pairs) segments.push([edge(a), edge(b)]);
		}
	}

	// Chain segments into polylines.
	const byPoint = new Map<string, number[]>();
	segments.forEach(([a, b], n) => {
		for (const p of [a, b]) {
			const k = key(p);
			const list = byPoint.get(k);
			if (list) list.push(n);
			else byPoint.set(k, [n]);
		}
	});

	const used = new Array<boolean>(segments.length).fill(false);
	const next = (p: Point): Point | null => {
		for (const n of byPoint.get(key(p)) ?? []) {
			if (used[n]) continue;
			used[n] = true;
			const [a, b] = segments[n];
			return key(a) === key(p) ? b : a;
		}
		return null;
	};

	const lines: Point[][] = [];
	segments.forEach(([a, b], n) => {
		if (used[n]) return;
		used[n] = true;
		const line: Point[] = [a, b];
		for (let p = next(b); p; p = next(p)) line.push(p);
		for (let p = next(a); p; p = next(p)) line.unshift(p);
		if (line.length > 3) lines.push(line);
	});
	return lines;
}

const fmt = (n: number) => Math.round(n).toString();

// Smooth polyline through segment midpoints with quadratic curves.
function toPath(line: Point[]): string {
	if (line.length < 3) return '';
	const mid = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
	let d = `M${fmt(line[0][0])} ${fmt(line[0][1])}`;
	for (let i = 1; i < line.length - 1; i++) {
		const m = mid(line[i], line[i + 1]);
		d += `Q${fmt(line[i][0])} ${fmt(line[i][1])} ${fmt(m[0])} ${fmt(m[1])}`;
	}
	const last = line[line.length - 1];
	return d + `L${fmt(last[0])} ${fmt(last[1])}`;
}

/**
 * Seamless tile of a fictional topographic map: forest on hilltops (closed
 * isolines), contours, a river, a road, a hiking trail, km grid and spot heights.
 */
export function mapSvg({ size, cell, levels, indexEvery }: MapOptions): string {
	const grid: number[][] = [];
	let min = Infinity;
	let max = -Infinity;
	for (let y = 0; y <= size; y += cell) {
		const row: number[] = [];
		for (let x = 0; x <= size; x += cell) {
			const z = terrain(x / size, y / size);
			row.push(z);
			min = Math.min(min, z);
			max = Math.max(max, z);
		}
		grid.push(row);
	}
	const at = (t: number) => min + (max - min) * t;

	const thin: string[] = [];
	const thick: string[] = [];
	for (let k = 1; k <= levels; k++) {
		const d = isolines(grid, at(k / (levels + 1)), cell).map(toPath).join('');
		(k % indexEvery === 0 ? thick : thin).push(d);
	}

	// Each closed ring is its own path, so nested rings simply union.
	const closed = (line: Point[]) => key(line[0]) === key(line[line.length - 1]);
	const forest = [0.45, 0.6, 0.75]
		.flatMap((t) => isolines(grid, at(t), cell).filter(closed))
		.map((l) => `<path d="${toPath(l)}Z"/>`)
		.join('');

	// Paths start and end on matching tile edges with matching tangents.
	const s = size / 1200;
	const scale = (d: string) => d.replace(/-?\d+(\.\d+)?/g, (n) => fmt(Number(n) * s));
	const road = scale('M0 200C200 200 300 120 500 160S800 280 950 230S1100 200 1200 200');
	const river = scale('M0 760C180 760 260 640 440 690S700 860 860 800S1060 760 1200 760');
	const trail = scale('M380 0C380 160 520 260 470 420S300 700 420 860S380 1080 380 1200');

	const gridLines: string[] = [];
	for (let v = size / 12; v < size; v += size / 6) gridLines.push(`M${fmt(v)} 0V${size}M0 ${fmt(v)}H${size}`);

	const peaks = hills.slice(0, 3).map((hill) => {
		const gx = Math.round((hill.x * size) / cell);
		const gy = Math.round((hill.y * size) / cell);
		const metres = Math.round(180 + ((grid[gy][gx] - min) / (max - min)) * 240);
		const x = gx * cell;
		const y = gy * cell;
		return `<path d="M${x} ${y - 6}l5 8h-10z"/><text x="${x + 8}" y="${y + 4}">${metres}</text>`;
	});

	return [
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">`,
		`<rect width="${size}" height="${size}" fill="#edead8"/>`,
		`<g fill="#d3e2bd">${forest}</g>`,
		`<g fill="none" stroke-linejoin="round" stroke-linecap="round">`,
		`<path d="${thin.join('')}" stroke="#cfae86" stroke-width="0.9"/>`,
		`<path d="${thick.join('')}" stroke="#b98a57" stroke-width="1.7"/>`,
		`<path d="${gridLines.join('')}" stroke="#8db0cf" stroke-width="0.6" opacity="0.7"/>`,
		`<path d="${river}" stroke="#9cc6e4" stroke-width="8"/>`,
		`<path d="${river}" stroke="#5f9ccc" stroke-width="1.2"/>`,
		`<path d="${road}" stroke="#8a7a68" stroke-width="6.5"/>`,
		`<path d="${road}" stroke="#f3d68a" stroke-width="4.5"/>`,
		`<path d="${trail}" stroke="#c8332f" stroke-width="2.2" stroke-dasharray="10 7"/>`,
		`</g>`,
		`<g font-family="ui-monospace, Menlo, monospace" font-size="12" fill="#6b4a2b">${peaks.join('')}</g>`,
		`</svg>`,
	].join('');
}
