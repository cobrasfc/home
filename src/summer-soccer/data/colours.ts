// Kit colour names → swatches. Text is always shown too; the swatch is a helpful extra, never the only signal.
import type { Colour } from '../domain/types';
import { tidy } from '../domain/teams';

const SWATCHES: Record<string, string> = {
	red: '#d62828',
	maroon: '#7a1f2b',
	burgundy: '#7a1f2b',
	pink: '#f06ba8',
	'hot pink': '#ff3d9a',
	magenta: '#d3208b',
	purple: '#6d3fb5',
	violet: '#7f4fd1',
	lilac: '#b79be0',
	blue: '#1f5fd1',
	'royal blue': '#2447b8',
	navy: '#1b2a5c',
	'navy blue': '#1b2a5c',
	'sky blue': '#5bb6ea',
	'light blue': '#7cc4ef',
	'baby blue': '#9fd3f2',
	'dark blue': '#1b2f7a',
	teal: '#138a8a',
	aqua: '#2cc9c9',
	turquoise: '#2cc3b5',
	cyan: '#22c3e6',
	green: '#2e9e44',
	'dark green': '#1f6b34',
	'bottle green': '#185c32',
	'light green': '#7ed17e',
	lime: '#9bd62a',
	'lime green': '#9bd62a',
	'fluro green': '#7cff3a',
	'fluoro green': '#7cff3a',
	'fluro yellow': '#e6ff2a',
	'fluoro yellow': '#e6ff2a',
	'fluro orange': '#ff7a1a',
	'fluoro orange': '#ff7a1a',
	'fluro pink': '#ff4fb0',
	'fluoro pink': '#ff4fb0',
	yellow: '#f2d61b',
	gold: '#d8a825',
	orange: '#f07c1b',
	brown: '#7a4a24',
	black: '#161616',
	white: '#ffffff',
	grey: '#8a9099',
	gray: '#8a9099',
	silver: '#b9bec6',
	charcoal: '#3c4047'
};

function titleCase(value: string): string {
	return value.toLowerCase().replace(/(^|[\s/-])([a-z])/g, (_, sep: string, ch: string) => sep + ch.toUpperCase());
}

export function normaliseColour(raw: string | undefined): Colour {
	const cleaned = tidy(raw).replace(/\bcolou?r\b/gi, '').trim();
	if (!cleaned) return { name: '', swatch: null };
	const key = cleaned.toLowerCase().replace(/fluorescent/g, 'fluoro');
	// "Blue/White" style kits: swatch uses the first colour, the full name is still shown
	const first = key.split(/\s*(?:\/|&|\band\b|,)\s*/)[0];
	return { name: titleCase(cleaned), swatch: SWATCHES[key] ?? SWATCHES[first] ?? null };
}

/** Light swatches need an outline to be visible against white cards. */
export function needsOutline(swatch: string | null): boolean {
	if (!swatch) return true;
	const hex = swatch.replace('#', '');
	const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
	return 0.299 * r + 0.587 * g + 0.114 * b > 200;
}
