// Stable team + division identity. IDs are what go in URLs and local storage, so they must never depend on
// display quirks (spacing, capitalisation, en-dashes) and must stay unique across divisions.
import type { Division, DivisionGroup } from './types';

export function slugify(value: string): string {
	return value
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/['’]/g, '')
		.replace(/&/g, ' and ')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

/** Collapse whitespace and trim — the first thing every spreadsheet value goes through. */
export function tidy(value: string | undefined | null): string {
	return (value ?? '').replace(/\s+/g, ' ').trim();
}

export function teamId(divisionName: string, teamName: string): string {
	return `${slugify(divisionName)}-${slugify(teamName)}`;
}

const JUNIOR_PATTERN = /\b(years?|yrs?|y\.?o\.?|u\s?\d{1,2}|under|junior|minis?|kids?)\b|^\d{1,2}\s*[-–]\s*\d{1,2}\b/i;

export function makeDivision(name: string): Division {
	const group: DivisionGroup = JUNIOR_PATTERN.test(name) ? 'junior' : 'senior';
	const firstNumber = name.match(/\d{1,2}/);
	const order = group === 'junior' ? Number(firstNumber?.[0] ?? 99) : seniorOrder(name);
	return { id: slugify(name), name, group, order };
}

function seniorOrder(name: string): number {
	const n = name.toLowerCase();
	if (/women|ladies|female/.test(n)) return 2;
	if (/\bmen|\bmale/.test(n)) return 1;
	if (/mixed/.test(n)) return 3;
	return 4;
}

export function compareDivisions(a: Division, b: Division): number {
	if (a.group !== b.group) return a.group === 'junior' ? -1 : 1;
	return a.order - b.order || a.name.localeCompare(b.name);
}

export function isByeName(name: string): boolean {
	return /^(bye|tbc bye|no game)$/i.test(tidy(name));
}
