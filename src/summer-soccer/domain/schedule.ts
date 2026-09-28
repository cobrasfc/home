// Which fixtures matter to this person, and which one is "next". Pure functions — no DOM, no fetching.
import type { Fixture, Schedule, Team } from './types';
import { zonedTimeToInstant } from '../utils/timezone';

export function resolveTeams(schedule: Schedule, ids: string[]): { teams: Team[]; unknownIds: string[] } {
	const byId = new Map(schedule.teams.map((t) => [t.id, t]));
	const teams: Team[] = [];
	const unknownIds: string[] = [];
	for (const id of ids) {
		const team = byId.get(id);
		if (team) teams.push(team);
		else unknownIds.push(id);
	}
	return { teams, unknownIds };
}

/** Fixtures involving any followed team — once each, even when two followed teams play each other. */
export function fixturesForTeams(schedule: Schedule, teams: Team[]): Fixture[] {
	const ids = new Set(teams.map((t) => t.id));
	return schedule.fixtures.filter((f) => (f.team1.team && ids.has(f.team1.team.id)) || (f.team2.team && ids.has(f.team2.team.id)));
}

/** The followed team(s) in a fixture, in fixture order. */
export function myTeamsIn(fixture: Fixture, teams: Team[]): Team[] {
	const ids = new Set(teams.map((t) => t.id));
	return [fixture.team1.team, fixture.team2.team].filter((t): t is Team => !!t && ids.has(t.id));
}

/** Sides as "mine vs theirs" from the perspective of the followed team(s). */
export function perspective(fixture: Fixture, teams: Team[]) {
	const ids = new Set(teams.map((t) => t.id));
	const team2IsMine = !!fixture.team2.team && ids.has(fixture.team2.team.id);
	const team1IsMine = !!fixture.team1.team && ids.has(fixture.team1.team.id);
	const flip = team2IsMine && !team1IsMine;
	return {
		mine: flip ? fixture.team2 : fixture.team1,
		theirs: flip ? fixture.team1 : fixture.team2,
		/** Both sides are followed teams (e.g. a parent with two kids in the same division) */
		bothMine: team1IsMine && team2IsMine
	};
}

/** When a fixture stops being "upcoming": its finish time, or the end of its day if the time isn't known. */
export function finishesAt(fixture: Fixture): Date | null {
	if (fixture.end) return fixture.end;
	if (fixture.date) return zonedTimeToInstant(fixture.date, 24 * 60);
	return null;
}

function sortKey(fixture: Fixture): number {
	if (fixture.start) return fixture.start.getTime();
	// Known day, unknown time: after that day's timed games
	if (fixture.date) return zonedTimeToInstant(fixture.date, 24 * 60 - 1).getTime();
	return Number.POSITIVE_INFINITY;
}

export function compareFixtures(a: Fixture, b: Fixture): number {
	return sortKey(a) - sortKey(b) || a.division.order - b.division.order || a.id.localeCompare(b.id);
}

export interface Timeline {
	/** The next game that is going ahead, shown as the hero. Stays "next" until its finish time. */
	next: Fixture | null;
	/** Cancellations, postponements and byes that fall before the next game — shown above it so nobody turns up. */
	alertsBeforeNext: Fixture[];
	/** Every fixture still to come, including `next`, chronological. */
	upcoming: Fixture[];
	/** Postponed games whose original date has passed — waiting on a new date from the club. */
	awaitingNewDate: Fixture[];
	/** Finished (or passed) fixtures, most recent first. */
	past: Fixture[];
	/** True when a game is being played right now (between kickoff and finish). */
	nextIsLive: boolean;
}

export function buildTimeline(fixtures: Fixture[], now: Date): Timeline {
	const sorted = [...fixtures].sort(compareFixtures);
	const upcoming: Fixture[] = [];
	const past: Fixture[] = [];
	const awaitingNewDate: Fixture[] = [];

	for (const f of sorted) {
		const finish = finishesAt(f);
		const isOver = finish !== null && finish.getTime() <= now.getTime();
		if (!isOver) upcoming.push(f);
		else if (f.status === 'postponed') awaitingNewDate.push(f);
		else past.push(f);
	}

	const next = upcoming.find((f) => f.status === 'scheduled' && !f.isBye && f.date !== null) ?? null;
	const nextIndex = next ? upcoming.indexOf(next) : upcoming.length;
	const alertsBeforeNext = upcoming
		.slice(0, nextIndex)
		.filter((f) => f.date !== null && (f.status !== 'scheduled' || f.isBye));

	return {
		next,
		alertsBeforeNext,
		upcoming,
		awaitingNewDate,
		past: past.reverse(),
		nextIsLive: !!next?.start && next.start.getTime() <= now.getTime()
	};
}

/** Games worth putting in a calendar: still to come, going ahead, and with a real date + time. */
export function calendarEligible(fixtures: Fixture[], now: Date): Fixture[] {
	const seen = new Set<string>();
	return fixtures
		.filter((f) => f.status === 'scheduled' && !f.isBye && f.start && f.end && f.end.getTime() > now.getTime())
		.filter((f) => (seen.has(f.id) ? false : (seen.add(f.id), true)))
		.sort(compareFixtures);
}
