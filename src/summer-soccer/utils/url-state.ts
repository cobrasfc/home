// Team selection lives in the URL (?teams=a,b) so links can be bookmarked, shared and handed out by the club.
import { zonedTimeToInstant } from './timezone';

export function readTeamIdsFromUrl(): string[] | null {
	const param = new URLSearchParams(window.location.search).get('teams');
	if (param === null) return null;
	return [...new Set(param.split(',').map((id) => id.trim().toLowerCase()).filter(Boolean))];
}

export function scheduleUrl(teamIds: string[]): string {
	const url = new URL(window.location.href);
	url.hash = '';
	// Keep commas readable in shared links
	url.search = teamIds.length ? `?teams=${teamIds.map(encodeURIComponent).join(',')}` : '';
	const now = new URLSearchParams(window.location.search).get('now');
	if (now) url.search += `${url.search ? '&' : '?'}now=${encodeURIComponent(now)}`;
	return url.toString();
}

export function writeTeamIdsToUrl(teamIds: string[]): void {
	const next = scheduleUrl(teamIds);
	if (next !== window.location.href) window.history.replaceState(null, '', next);
}

/** Link to share: the teams only (never the preview clock). */
export function shareUrl(teamIds: string[]): string {
	const url = new URL(window.location.origin + window.location.pathname);
	return `${url.toString()}?teams=${teamIds.map(encodeURIComponent).join(',')}`;
}

/**
 * Preview clock for checking the schedule at another moment: ?now=2026-10-19T18:50 (read as Sydney time).
 * Only affects this page view; handy for the club to check how the page will look on game night.
 */
export function readPreviewNow(): Date | null {
	const raw = new URLSearchParams(window.location.search).get('now');
	const m = raw?.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{1,2}):(\d{2}))?$/);
	if (!m) return null;
	return zonedTimeToInstant({ year: +m[1], month: +m[2], day: +m[3] }, (+(m[4] ?? 12)) * 60 + +(m[5] ?? 0));
}
