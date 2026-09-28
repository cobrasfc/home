// localStorage can be missing or throw (private mode, blocked storage, in-app browsers). Never let that break
// the schedule — the URL is always the fallback source of truth for team selection.

export function readJson<T>(key: string): T | null {
	try {
		const raw = window.localStorage.getItem(key);
		return raw ? (JSON.parse(raw) as T) : null;
	} catch {
		return null;
	}
}

export function writeJson<T>(key: string, value: T): void {
	try {
		window.localStorage.setItem(key, JSON.stringify(value));
	} catch {
		// Storage full or unavailable — nothing to do
	}
}

const TEAMS_KEY = 'cobras-summer-teams-v1';

export function readSavedTeamIds(): string[] {
	const saved = readJson<unknown>(TEAMS_KEY);
	return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === 'string') : [];
}

export function saveTeamIds(ids: string[]): void {
	writeJson(TEAMS_KEY, ids);
}
