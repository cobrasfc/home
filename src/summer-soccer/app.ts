// Page controller: loads fixtures, resolves the followed teams, and renders the right view.
// Schedule logic lives in domain/, data access in data/ — this file only wires them to the DOM.
import { SUMMER_SCHEDULE } from '../site.config';
import { defaultSource, readCachedRows, writeCachedRows, type SourceResult } from './data/source';
import { parseSchedule } from './data/parse';
import { formatStamp, relativeDayLabel } from './domain/dates';
import { buildTimeline, calendarEligible, fixturesForTeams, resolveTeams } from './domain/schedule';
import type { Schedule, Team } from './domain/types';
import { buildIcs, downloadIcs, googleCalendarUrl } from './utils/ics';
import { esc } from './utils/html';
import { readSavedTeamIds, saveTeamIds } from './utils/storage';
import { readPreviewNow, readTeamIdsFromUrl, shareUrl, writeTeamIdsToUrl } from './utils/url-state';
import { FixtureList } from './ui/FixtureList';
import { AlertCard, NextGameCard } from './ui/NextGameCard';
import { AllGamesCalendar, ErrorState, NextGameCalendar, NoNextGame, Support, WrapCard } from './ui/panels';
import { swatch } from './ui/bits';
import { TeamSelector, type PickerState } from './ui/TeamSelector';

const root = document.getElementById('ss-app')!;
const changeTeamsButton = document.getElementById('ss-change-teams') as HTMLButtonElement | null;

// Preview clock (?now=2026-10-19T18:50) keeps ticking from the chosen moment
const previewNow = readPreviewNow();
const clockOffset = previewNow ? previewNow.getTime() - Date.now() : 0;
const now = () => new Date(Date.now() + clockOffset);

const debug = import.meta.env.DEV || new URLSearchParams(location.search).has('debug');

const state = {
	schedule: null as Schedule | null,
	source: null as SourceResult | null,
	/** Showing a saved copy because the latest fetch failed */
	stale: false,
	/** Showing the saved copy while the first fetch is still in flight */
	fromCache: false,
	refreshing: false,
	error: null as string | null,
	selectedIds: readTeamIdsFromUrl() ?? readSavedTeamIds(),
	fromUrl: readTeamIdsFromUrl() !== null,
	view: 'schedule' as 'schedule' | 'picker',
	picker: { draft: [], divisionId: null, notice: null, editing: false } as PickerState,
	teamNotice: null as string | null,
	pastOpen: false,
	lastFetch: 0,
	renderedSignature: ''
};

const source = defaultSource();

function logWarnings(schedule: Schedule) {
	if (!debug || !schedule.warnings.length) return;
	console.groupCollapsed(`[Summer Soccer] ${schedule.warnings.length} fixture sheet warning(s)`);
	for (const w of schedule.warnings) console.warn(w.row ? `Row ${w.row}: ${w.message}` : w.message);
	console.groupEnd();
}

function applyRows(result: SourceResult) {
	const schedule = parseSchedule(result.rows, now());
	state.schedule = schedule;
	state.source = result;
	logWarnings(schedule);
}

async function load() {
	state.refreshing = true;
	state.error = null;
	updateStatusBar();
	try {
		const result = await source.load();
		applyRows(result);
		writeCachedRows(result);
		state.stale = false;
	} catch (error) {
		console.error('[Summer Soccer] Could not load fixtures', error);
		if (state.schedule) state.stale = true;
		else state.error = error instanceof Error ? error.message : String(error);
	} finally {
		state.refreshing = false;
		state.fromCache = false;
		state.lastFetch = Date.now();
		render(true);
	}
}

/** Validate the followed teams against the loaded fixtures; decide between picker and schedule. */
function resolveSelection(schedule: Schedule): Team[] {
	const { teams, unknownIds } = resolveTeams(schedule, state.selectedIds);
	if (unknownIds.length && teams.length) {
		state.teamNotice = `We couldn't find ${unknownIds.length === 1 ? 'one of your saved teams' : `${unknownIds.length} of your saved teams`} in this season's fixtures, so we've removed it.`;
	}
	if (unknownIds.length && !teams.length && state.view === 'schedule') {
		state.view = 'picker';
		state.picker = {
			draft: [],
			divisionId: null,
			notice: `We couldn't find your saved team${unknownIds.length > 1 ? 's' : ''} in this season's fixtures. The name or division may have changed — please pick again.`,
			editing: false
		};
	}
	if (unknownIds.length && !state.stale) {
		state.selectedIds = teams.map((t) => t.id);
	}
	if (teams.length) {
		saveTeamIds(teams.map((t) => t.id));
		writeTeamIdsToUrl(teams.map((t) => t.id));
	}
	if (!teams.length && state.view === 'schedule') {
		state.view = 'picker';
	}
	return teams;
}

function statusBar(): string {
	const bits: string[] = [];
	if (state.source?.isSample) {
		// Trusted HTML from site config
		bits.push(`<p class="ss-banner ss-banner--sample">${SUMMER_SCHEDULE.sampleNotice}</p>`);
	}
	if (previewNow) {
		bits.push(`<p class="ss-banner ss-banner--preview">Previewing the page as at ${esc(formatStamp(now()))} (Sydney time).</p>`);
	}
	if (state.stale && state.source) {
		bits.push(`<p class="ss-banner ss-banner--stale" role="status">Couldn't check for fixture changes. Showing the schedule saved ${esc(formatStamp(state.source.fetchedAt))}.
			<button type="button" class="ss-linkbtn" data-action="retry">Try again</button></p>`);
	} else if (state.refreshing && state.schedule) {
		bits.push('<p class="ss-banner ss-banner--checking" role="status">Checking for fixture changes…</p>');
	}
	return bits.join('');
}

function updateStatusBar() {
	const bar = root.querySelector('[data-status-bar]');
	if (bar) bar.innerHTML = statusBar();
}

function scheduleView(schedule: Schedule, teams: Team[]): string {
	const at = now();
	const mine = fixturesForTeams(schedule, teams);
	const timeline = buildTimeline(mine, at);
	const link = shareUrl(teams.map((t) => t.id));
	const eligible = calendarEligible(mine, at);

	const hidden = new Set([timeline.next?.id, ...timeline.alertsBeforeNext.map((f) => f.id)]);
	const comingUp = timeline.upcoming.filter((f) => !hidden.has(f.id));
	const waiting = timeline.awaitingNewDate;

	const teamNames = teams.map((t) => `${t.name} (${t.division.name})`).join(', ');
	let main = '';

	if (timeline.next) {
		main += timeline.alertsBeforeNext.map((f) => AlertCard(f, teams, at)).join('');
		main += NextGameCard(timeline.next, teams, at, timeline.nextIsLive, NextGameCalendar(googleCalendarUrl(timeline.next, teams, link)));
	} else if (timeline.upcoming.length || waiting.length) {
		main += timeline.upcoming.filter((f) => f.date && f.status !== 'scheduled').map((f) => AlertCard(f, teams, at)).join('');
		main += NoNextGame();
	} else {
		main += WrapCard();
	}

	const upcomingSection = comingUp.length || waiting.length
		? `<section class="ss-section" aria-labelledby="ss-upcoming-heading">
				<h2 id="ss-upcoming-heading" class="ss-section__title">Coming up</h2>
				${comingUp.length ? FixtureList(comingUp, teams, 'Upcoming games') : ''}
				${waiting.length ? `<h3 class="ss-section__sub">Waiting on a new date</h3>${FixtureList(waiting, teams, 'Postponed games awaiting a new date')}` : ''}
				${AllGamesCalendar(eligible.length)}
			</section>`
		: eligible.length ? AllGamesCalendar(eligible.length) : '';

	const pastSection = timeline.past.length
		? `<details class="ss-past" ${state.pastOpen || (!timeline.upcoming.length && !waiting.length) ? 'open' : ''} data-past>
				<summary class="ss-past__summary">View previous games (${timeline.past.length})</summary>
				${FixtureList(timeline.past, teams, 'Previous games')}
			</details>`
		: '';

	return `<h1 class="sr-only">Summer Soccer schedule for ${esc(teamNames)}</h1>
		${state.teamNotice ? `<p class="ss-notice" role="status">${esc(state.teamNotice)}</p>` : ''}
		${main}
		${upcomingSection}
		${pastSection}
		<section class="ss-share" aria-labelledby="ss-share-heading">
			<h2 id="ss-share-heading" class="ss-share__title">Share with your team mates</h2>
			<p class="ss-share__intro">Send your team this link — it opens straight to your team’s games, fields and times. No sign-up needed.</p>
			${teams
				.map((t) => {
					const link = shareUrl([t.id]);
					return `<div class="ss-teamshare">
					<p class="ss-teamshare__team">${swatch(t.colour)}<strong>${esc(t.name)}</strong> <span class="ss-share__div">${esc(t.division.name)}</span></p>
					<p class="ss-teamshare__link">${esc(link.replace(/^https?:\/\//, ''))}</p>
					<div class="ss-share__actions">
						<button type="button" class="ss-btn ss-btn--primary" data-action="share-team" data-team="${esc(t.id)}">Share link</button>
						<button type="button" class="ss-btn ss-btn--outline" data-action="copy-team" data-team="${esc(t.id)}">Copy link</button>
					</div>
					<p class="ss-fineprint" data-share-feedback="${esc(t.id)}" aria-live="polite"></p>
				</div>`;
				})
				.join('')}
			<div class="ss-share__actions ss-share__footer">
				${teams.length > 1 ? '<button type="button" class="ss-btn ss-btn--ghost" data-action="share">Share all my teams</button>' : ''}
				<button type="button" class="ss-btn ss-btn--ghost" data-action="change-teams">Change teams</button>
			</div>
			<p class="ss-fineprint" data-share-feedback aria-live="polite"></p>
		</section>
		${Support()}`;
}

function signature(): string {
	if (!state.schedule) return '';
	const { teams } = resolveTeams(state.schedule, state.selectedIds);
	const at = now();
	const t = buildTimeline(fixturesForTeams(state.schedule, teams), at);
	return [t.next?.id, t.nextIsLive, t.upcoming.length, t.past.length, t.next ? relativeDayLabel(t.next, at) : ''].join('|');
}

function render(dataChanged = false) {
	if (!state.schedule) {
		if (state.error) {
			root.setAttribute('aria-busy', 'false');
			root.innerHTML = `<div data-status-bar>${statusBar()}</div>${ErrorState(state.error)}`;
		}
		return;
	}
	// A saved copy may predate the team in the link (e.g. fixtures changed since this phone last visited) —
	// keep the loading state rather than wrongly saying the team can't be found; fresh data decides.
	if (state.fromCache && resolveTeams(state.schedule, state.selectedIds).unknownIds.length) return;

	changeTeamsButton?.toggleAttribute('hidden', true);
	root.setAttribute('aria-busy', 'false');
	// Don't rebuild the picker under someone's thumb when a background refresh lands
	if (state.view === 'picker' && dataChanged && root.querySelector('.ss-picker')) {
		updateStatusBar();
		return;
	}

	const teams = resolveSelection(state.schedule);
	let body: string;
	if (state.view === 'picker') {
		body = TeamSelector(state.schedule, state.picker);
	} else {
		changeTeamsButton?.toggleAttribute('hidden', false);
		body = scheduleView(state.schedule, teams);
	}
	root.innerHTML = `<div data-status-bar>${statusBar()}</div>${body}`;
	state.renderedSignature = signature();
}

function openPicker() {
	state.picker = {
		draft: [...state.selectedIds],
		divisionId: null,
		notice: null,
		editing: state.selectedIds.length > 0
	};
	state.view = 'picker';
	render();
	window.scrollTo({ top: 0 });
	(root.querySelector('#ss-picker-heading') as HTMLElement | null)?.focus();
}

function currentTeams(): Team[] {
	return state.schedule ? resolveTeams(state.schedule, state.selectedIds).teams : [];
}

/** Share (phone share sheet) or copy one team's own schedule link, for sending to team mates */
async function shareTeam(button: HTMLElement, mode: 'share' | 'copy') {
	const id = button.dataset.team!;
	const team = currentTeams().find((t) => t.id === id);
	if (!team) return;
	const link = shareUrl([id]);
	const feedback = root.querySelector(`[data-share-feedback="${CSS.escape(id)}"]`);
	try {
		if (mode === 'share' && navigator.share) {
			await navigator.share({ title: `${team.name} — Summer Soccer schedule`, text: `${team.name}'s Summer Soccer games, fields and times:`, url: link });
			return;
		}
		await navigator.clipboard.writeText(link);
		if (feedback) feedback.textContent = 'Link copied — paste it into your team chat.';
	} catch (error) {
		if ((error as Error)?.name === 'AbortError') return;
		if (feedback) feedback.innerHTML = `Copy this link: <a href="${esc(link)}">${esc(link)}</a>`;
	}
}

async function share(button: HTMLElement) {
	const link = shareUrl(state.selectedIds);
	const feedback = root.querySelector('[data-share-feedback]');
	try {
		if (navigator.share) {
			await navigator.share({ title: 'Metford Cobras Summer Soccer schedule', url: link });
			return;
		}
		await navigator.clipboard.writeText(link);
		if (feedback) feedback.textContent = 'Link copied — paste it anywhere to share these teams.';
	} catch (error) {
		if ((error as Error)?.name === 'AbortError') return;
		if (feedback) feedback.innerHTML = `Copy this link: <a href="${esc(link)}">${esc(link)}</a>`;
	}
	button.blur();
}

root.addEventListener('click', (event) => {
	const target = (event.target as HTMLElement).closest<HTMLElement>('[data-action]');
	if (!target || !state.schedule && target.dataset.action !== 'retry') return;
	const action = target.dataset.action;

	switch (action) {
		case 'retry':
			load();
			break;
		case 'pick-division':
			state.picker.divisionId = state.picker.divisionId === target.dataset.division ? null : target.dataset.division!;
			render();
			root.querySelector<HTMLElement>(`[data-action="pick-division"][data-division="${target.dataset.division}"]`)?.focus();
			root.querySelector('.ss-teams')?.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
			break;
		case 'toggle-team': {
			const id = target.dataset.team!;
			const draft = state.picker.draft;
			state.picker.draft = draft.includes(id) ? draft.filter((d) => d !== id) : [...draft, id];
			render();
			const same = root.querySelector<HTMLElement>(`.ss-teambtn[data-team="${id}"]`);
			(same ?? root.querySelector<HTMLElement>('[data-action="confirm-teams"]'))?.focus();
			break;
		}
		case 'confirm-teams':
			if (!state.picker.draft.length) return;
			state.selectedIds = [...state.picker.draft];
			state.teamNotice = null;
			state.view = 'schedule';
			saveTeamIds(state.selectedIds);
			writeTeamIdsToUrl(state.selectedIds);
			render();
			window.scrollTo({ top: 0 });
			break;
		case 'cancel-picker':
			state.view = 'schedule';
			render();
			break;
		case 'change-teams':
			openPicker();
			break;
		case 'share':
			share(target);
			break;
		case 'share-team':
			shareTeam(target, 'share');
			break;
		case 'copy-team':
			shareTeam(target, 'copy');
			break;
		case 'calendar-next': {
			const teams = currentTeams();
			const next = buildTimeline(fixturesForTeams(state.schedule!, teams), now()).next;
			if (next) downloadIcs('cobras-next-game.ics', buildIcs([next], teams, shareUrl(state.selectedIds)));
			break;
		}
		case 'calendar-all': {
			const teams = currentTeams();
			const games = calendarEligible(fixturesForTeams(state.schedule!, teams), now());
			downloadIcs('cobras-summer-soccer.ics', buildIcs(games, teams, shareUrl(state.selectedIds)));
			break;
		}
	}
});

root.addEventListener('toggle', (event) => {
	const el = event.target as HTMLElement;
	if (el.matches?.('[data-past]')) state.pastOpen = (el as HTMLDetailsElement).open;
}, true);

changeTeamsButton?.addEventListener('click', openPicker);

// Roll the hero over at finish time, "Tomorrow" → "Tonight" at midnight, etc. — without a reload.
setInterval(() => {
	if (state.view !== 'schedule' || !state.schedule) return;
	if (signature() !== state.renderedSignature) render();
}, 20_000);

// Keep fixtures fresh while the page is open, and re-check when someone comes back to the tab.
const refreshMs = SUMMER_SCHEDULE.refreshMinutes * 60_000;
setInterval(() => {
	if (document.visibilityState === 'visible') load();
}, refreshMs);
document.addEventListener('visibilitychange', () => {
	if (document.visibilityState !== 'visible') return;
	if (Date.now() - state.lastFetch > 60_000) load();
	else if (signature() !== state.renderedSignature) render();
});

// Show the last saved copy instantly (patchy reception at the ground), then refresh from the sheet.
const cached = readCachedRows();
if (cached) {
	try {
		applyRows(cached);
		state.refreshing = true;
		state.fromCache = true;
		render();
	} catch {
		state.schedule = null;
	}
}
load();
