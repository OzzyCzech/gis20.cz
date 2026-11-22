// Helpers for paper scraps: deterministic randomness and clip-path edge shapes.

export function rng(seed: number) {
	let t = seed + 0x6d2b79f5;
	return () => {
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export type Edges = 'torn' | 'torn-top' | 'cut' | 'zigzag' | 'straight';

/** CSS clip-path polygon for the given edge style (stable for a seed). */
export function edgePath(edges: Edges, seed: number): string | undefined {
	if (edges === 'straight') return undefined;
	const rand = rng(seed);
	const px = (max: number) => `${(rand() * max).toFixed(1)}px`;
	const pts: string[] = [];

	const jaggedTop = () => {
		for (let x = 0; x <= 100; x += 3) pts.push(`${x}% ${px(6)}`);
	};
	const jaggedBottom = () => {
		for (let x = 100; x >= 0; x -= 3) pts.push(`${x}% calc(100% - ${px(7)})`);
	};

	switch (edges) {
		case 'torn':
			jaggedTop();
			for (let y = 5; y <= 95; y += 6) pts.push(`calc(100% - ${px(5)}) ${y}%`);
			jaggedBottom();
			for (let y = 95; y >= 5; y -= 6) pts.push(`${px(5)} ${y}%`);
			break;
		case 'torn-top':
			jaggedTop();
			pts.push(`100% 100%`, `0 100%`);
			break;
		case 'cut':
			pts.push(`${px(4)} 0`, `100% ${px(4)}`, `calc(100% - ${px(4)}) 100%`, `0 calc(100% - ${px(4)})`);
			break;
		case 'zigzag':
			pts.push('0 0', '100% 0');
			for (let x = 100, i = 0; x >= 0; x -= 2.5, i++) pts.push(`${x}% calc(100% - ${i % 2 ? 0 : 9}px)`);
			break;
	}
	return `polygon(${pts.join(',')})`;
}
