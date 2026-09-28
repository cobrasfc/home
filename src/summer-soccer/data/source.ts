// Where fixtures come from. The UI only depends on `FixtureSource` — swap in a different adapter (JSON API,
// another spreadsheet host) without touching anything else.
import { SUMMER_SCHEDULE } from '../../site.config';
import { withBase } from '../../utils/withBase';
import { readJson, writeJson } from '../utils/storage';
import { parseCsv } from './csv';

export interface SourceResult {
	rows: string[][];
	/** When this data was fetched from the source */
	fetchedAt: Date;
	/** True when these are the bundled example fixtures rather than the club's real sheet */
	isSample: boolean;
}

export interface FixtureSource {
	load(): Promise<SourceResult>;
}

/**
 * Accepts either a "Publish to web" CSV link (recommended) or a normal Google Sheets link shared as
 * "Anyone with the link can view" — the latter is converted to the Sheets CSV export endpoint.
 */
export function toCsvUrl(url: string): string {
	const edit = url.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]{20,})\/(?:edit|view)?(?:[^#]*)(?:#gid=(\d+))?/);
	if (edit && !url.includes('/d/e/') && !/output=csv|tqx=out:csv/.test(url)) {
		return `https://docs.google.com/spreadsheets/d/${edit[1]}/gviz/tq?tqx=out:csv&gid=${edit[2] ?? '0'}`;
	}
	return url;
}

async function fetchText(url: string, signal?: AbortSignal): Promise<string> {
	// no-store: always ask the network, so a fixture change in the sheet shows up on the next load
	const response = await fetch(url, { cache: 'no-store', signal, redirect: 'follow' });
	if (!response.ok) throw new Error(`Fixture sheet responded ${response.status}`);
	const text = await response.text();
	if (/^\s*<!doctype html|^\s*<html/i.test(text)) {
		throw new Error('Fixture sheet returned a web page instead of CSV — check it is published/shared publicly');
	}
	return text;
}

export function csvSource(url: string, isSample: boolean, timeoutMs = 12_000): FixtureSource {
	return {
		async load() {
			const controller = new AbortController();
			const timer = setTimeout(() => controller.abort(), timeoutMs);
			try {
				const text = await fetchText(url, controller.signal);
				return { rows: parseCsv(text), fetchedAt: new Date(), isSample };
			} finally {
				clearTimeout(timer);
			}
		}
	};
}

/** The configured source: the club's Google Sheet, or the bundled sample fixtures until one is set. */
export function defaultSource(): FixtureSource {
	const sheet = SUMMER_SCHEDULE.sheetCsvUrl.trim();
	return sheet ? csvSource(toCsvUrl(sheet), false) : csvSource(withBase(SUMMER_SCHEDULE.sampleCsvPath), true);
}

// Last successfully-loaded copy, so someone with patchy reception at the ground still sees their game
// (clearly labelled with when it was saved) while a fresh copy is fetched.
const CACHE_KEY = 'cobras-summer-fixtures-cache-v1';

interface CachedRows {
	rows: string[][];
	fetchedAt: string;
	isSample: boolean;
	source: string;
}

export function readCachedRows(): SourceResult | null {
	const cached = readJson<CachedRows>(CACHE_KEY);
	if (!cached || !Array.isArray(cached.rows) || cached.source !== SUMMER_SCHEDULE.sheetCsvUrl) return null;
	return { rows: cached.rows, fetchedAt: new Date(cached.fetchedAt), isSample: cached.isSample };
}

export function writeCachedRows(result: SourceResult): void {
	writeJson<CachedRows>(CACHE_KEY, {
		rows: result.rows,
		fetchedAt: result.fetchedAt.toISOString(),
		isSample: result.isSample,
		source: SUMMER_SCHEDULE.sheetCsvUrl
	});
}
