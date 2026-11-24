// Czech typography: a one-letter preposition or conjunction (k, s, v, z, o, u, a, i) must not end a line,
// so the space after it becomes a non-breaking one.
export function nbsp(text: string): string {
	return text.replace(/(?<=^|[\s(„])([AaIiKkOoSsUuVvZz]) /g, '$1 ');
}
