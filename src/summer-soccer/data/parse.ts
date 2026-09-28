// Spreadsheet rows → normalised Schedule. Forgiving about human spreadsheet habits (spacing, casing, "Field 4" vs
// "4", "6:30pm" vs "18:30"), but never silently invents data: anything it can't read cleanly becomes a warning,
// and the fixture is still shown with that detail marked as "TBC".
import { SUMMER_SCHEDULE } from '../../site.config';
import { findField } from '../fields';
import { compareDivisions, isByeName, makeDivision, slugify, teamId, tidy } from '../domain/teams';
import type {
	CivilDate,
	Colour,
	Division,
	Fixture,
	FixtureSide,
	FixtureStatus,
	ParseWarning,
	Schedule,
	Team
} from '../domain/types';
import { zonedTimeToInstant } from '../utils/timezone';
import { normaliseColour } from './colours';

type Column =
	| 'round'
	| 'division'
	| 'date'
	| 'start'
	| 'finish'
	| 'field'
	| 'team1'
	| 'team1Colour'
	| 'team2'
	| 'team2Colour'
	| 'status'
	| 'note';

const HEADER_ALIASES: Record<Column, string[]> = {
	round: ['round', 'rd', 'week', 'roundno', 'roundnumber'],
	division: ['division', 'div', 'competition', 'comp', 'grade', 'agegroup'],
	date: ['date', 'gamedate', 'matchdate', 'day'],
	start: ['starttime', 'start', 'kickoff', 'kickofftime', 'time'],
	finish: ['finishtime', 'finish', 'endtime', 'end'],
	field: ['field', 'fieldnumber', 'fieldname', 'fieldnumbername', 'fieldno', 'pitch', 'ground'],
	team1: ['team1', 'teamone', 'hometeam', 'home'],
	team1Colour: ['team1colour', 'team1color', 'team1colours', 'homecolour', 'homecolor'],
	team2: ['team2', 'teamtwo', 'awayteam', 'away'],
	team2Colour: ['team2colour', 'team2color', 'team2colours', 'awaycolour', 'awaycolor'],
	status: ['status', 'fixturestatus', 'gamestatus'],
	note: ['note', 'notes', 'message', 'fixturemessage', 'fixturenote', 'comment', 'comments']
};

const headerKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

function mapHeader(cells: string[]): Partial<Record<Column, number>> {
	const map: Partial<Record<Column, number>> = {};
	cells.forEach((cell, index) => {
		const key = headerKey(cell);
		for (const [column, aliases] of Object.entries(HEADER_ALIASES) as [Column, string[]][]) {
			if (map[column] === undefined && aliases.includes(key)) map[column] = index;
		}
	});
	return map;
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function validDate(year: number, month: number, day: number): CivilDate | null {
	const d = new Date(Date.UTC(year, month - 1, day));
	return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day
		? { year, month, day }
		: null;
}

/** Dates are read as Australian day/month/year. Returns a reason string when it can't be read. */
export function parseDate(raw: string, fallbackYear: number): CivilDate | string {
	const value = tidy(raw).replace(/(\d)(st|nd|rd|th)\b/gi, '$1');
	if (!value) return 'missing date';

	let m = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
	if (m) return validDate(+m[1], +m[2], +m[3]) ?? `"${raw}" isn't a real date`;

	m = value.match(/^(?:[a-z]+,?\s+)?(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?$/i);
	if (m) {
		const year = m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : fallbackYear;
		return validDate(year, +m[2], +m[1]) ?? `"${raw}" isn't a valid day/month/year date`;
	}

	// "Monday 19 October 2026", "19 Oct", "October 19, 2026"
	const words = value.toLowerCase().replace(/,/g, ' ').split(/\s+/);
	const monthIndex = words.findIndex((w) => MONTHS.includes(w.slice(0, 3)) && /^[a-z]+$/.test(w));
	if (monthIndex >= 0) {
		const numbers = words.filter((w) => /^\d+$/.test(w)).map(Number);
		const day = numbers.find((n) => n >= 1 && n <= 31);
		const year = numbers.find((n) => n > 31) ?? fallbackYear;
		if (day) return validDate(year, MONTHS.indexOf(words[monthIndex].slice(0, 3)) + 1, day) ?? `"${raw}" isn't a real date`;
	}

	// Excel/Sheets serial day number (e.g. 46314)
	if (/^\d{5}(\.\d+)?$/.test(value)) {
		const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(+value) * 86_400_000);
		return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
	}

	return `couldn't read date "${raw}"`;
}

/** Minutes after midnight, or a reason string. `assumedPm` is set when a bare time like "6:30" was read as pm. */
export function parseTime(raw: string): { minutes: number; assumedPm: boolean } | string | null {
	// "6.30pm" → "6:30pm", "p.m." → "pm"
	const value = tidy(raw).toLowerCase().replace(/(\d)\.(\d)/g, '$1:$2').replace(/\./g, '');
	if (!value) return null;
	const m = value.match(/^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*(am|pm)?$/);
	if (!m) return `couldn't read time "${raw}"`;
	let hour = +m[1];
	const minute = m[2] ? +m[2] : 0;
	const meridiem = m[3];
	if (minute > 59 || hour > 23) return `"${raw}" isn't a valid time`;
	if (meridiem) {
		if (hour < 1 || hour > 12) return `"${raw}" isn't a valid time`;
		if (meridiem === 'pm' && hour !== 12) hour += 12;
		if (meridiem === 'am' && hour === 12) hour = 0;
		return { minutes: hour * 60 + minute, assumedPm: false };
	}
	if (hour >= 1 && hour <= 11 && SUMMER_SCHEDULE.bareTimesArePm) return { minutes: (hour + 12) * 60 + minute, assumedPm: true };
	return { minutes: hour * 60 + minute, assumedPm: false };
}

function parseStatus(raw: string): { status: FixtureStatus; unknown: boolean } {
	const value = tidy(raw).toLowerCase();
	if (!value || /^(scheduled|sched|on|confirmed|go|going ahead|active|ok|yes)$/.test(value)) return { status: 'scheduled', unknown: false };
	if (/cancel|washed out|abandon|called off/.test(value)) return { status: 'cancelled', unknown: false };
	if (/postpone|^ppd$|delayed|resched|tba|tbc/.test(value)) return { status: 'postponed', unknown: false };
	return { status: 'scheduled', unknown: true };
}

function parseRound(raw: string): { round: number | null; label: string } {
	const value = tidy(raw);
	const n = value.match(/^(?:round|rd|r|week|wk)?\.?\s*(\d{1,2})$/i)?.[1];
	if (n) return { round: +n, label: `Round ${+n}` };
	return { round: null, label: value };
}

const DEFAULT_GAME_MINUTES = 60;

export function parseSchedule(rows: string[][], now: Date = new Date()): Schedule {
	const warnings: ParseWarning[] = [];
	const warn = (row: number, message: string) => warnings.push({ row, message });

	const headerIndex = rows.findIndex((cells) => {
		const map = mapHeader(cells);
		return map.team1 !== undefined && map.team2 !== undefined;
	});
	if (headerIndex < 0) throw new Error('The fixture sheet has no header row with "Team 1" and "Team 2" columns.');

	const columns = mapHeader(rows[headerIndex]);
	for (const column of ['division', 'date', 'start', 'field'] as Column[]) {
		if (columns[column] === undefined) warn(headerIndex + 1, `No "${column}" column found in the header row`);
	}

	const divisions = new Map<string, Division>();
	const teams = new Map<string, Team>();
	const teamColourVotes = new Map<string, Map<string, { colour: Colour; count: number }>>();
	const fixtures: Fixture[] = [];
	const fixtureIds = new Set<string>();
	const fallbackYear = now.getUTCFullYear();

	const getTeam = (division: Division, name: string, colour: Colour): Team => {
		const id = teamId(division.name, name);
		let team = teams.get(id);
		if (!team) {
			team = { id, name, division, colour };
			teams.set(id, team);
		}
		if (colour.name) {
			const votes = teamColourVotes.get(id) ?? new Map();
			const key = colour.name.toLowerCase();
			votes.set(key, { colour, count: (votes.get(key)?.count ?? 0) + 1 });
			teamColourVotes.set(id, votes);
		}
		return team;
	};

	for (let i = headerIndex + 1; i < rows.length; i++) {
		const rowNumber = i + 1;
		const cells = rows[i];
		const cell = (column: Column) => (columns[column] === undefined ? '' : tidy(cells[columns[column]!]));
		if (cells.every((c) => !tidy(c))) continue;

		const divisionName = cell('division');
		let team1Name = cell('team1');
		let team2Name = cell('team2');
		if (!divisionName) {
			warn(rowNumber, 'Skipped: no division');
			continue;
		}
		if (!team1Name && !team2Name) {
			warn(rowNumber, 'Skipped: no teams');
			continue;
		}

		const divisionId = slugify(divisionName);
		let division = divisions.get(divisionId);
		if (!division) {
			division = makeDivision(divisionName);
			divisions.set(divisionId, division);
		}

		// A bye is always shown from the playing team's side
		if (isByeName(team1Name) && team2Name) [team1Name, team2Name] = [team2Name, team1Name];
		const isBye = isByeName(team2Name);

		const side = (name: string, colourRaw: string, label: string): FixtureSide => {
			if (!name) {
				warn(rowNumber, `${label} is blank — shown as "TBC"`);
				return { team: null, name: 'TBC', colour: normaliseColour(colourRaw) };
			}
			if (isByeName(name)) return { team: null, name: 'Bye', colour: { name: '', swatch: null } };
			const colour = normaliseColour(colourRaw);
			if (colourRaw && !colour.swatch) warn(rowNumber, `Colour "${colourRaw}" has no swatch — the name is still shown`);
			const team = getTeam(division!, name, colour);
			return { team, name: team.name, colour };
		};
		const team1 = side(team1Name, cell('team1Colour'), 'Team 1');
		const team2 = side(team2Name, cell('team2Colour'), 'Team 2');

		const { round, label: roundLabel } = parseRound(cell('round'));

		const parsedDate = parseDate(cell('date'), fallbackYear);
		const date = typeof parsedDate === 'string' ? null : parsedDate;
		if (typeof parsedDate === 'string') warn(rowNumber, parsedDate);

		const timeOf = (column: Column) => {
			const parsed = parseTime(cell(column));
			if (typeof parsed === 'string') {
				warn(rowNumber, parsed);
				return null;
			}
			if (parsed?.assumedPm) warn(rowNumber, `"${cell(column)}" has no am/pm — read as pm`);
			return parsed?.minutes ?? null;
		};
		const startMinutes = timeOf('start');
		let endMinutes = timeOf('finish');
		if (startMinutes == null && !isBye) warn(rowNumber, 'Missing start time — shown as "Time TBC"');
		if (startMinutes != null && endMinutes != null && endMinutes <= startMinutes) {
			warn(rowNumber, 'Finish time is not after start time — finish ignored');
			endMinutes = null;
		}

		const start = date && startMinutes != null ? zonedTimeToInstant(date, startMinutes) : null;
		const end =
			date && startMinutes != null
				? zonedTimeToInstant(date, endMinutes ?? startMinutes + DEFAULT_GAME_MINUTES)
				: null;

		const fieldRaw = cell('field');
		const field = fieldRaw ? findField(fieldRaw) : null;
		if (!fieldRaw && !isBye) warn(rowNumber, 'Missing field — shown as "Field TBC"');
		if (fieldRaw && !field) warn(rowNumber, `Field "${fieldRaw}" isn't on the ground map — shown as typed, no map highlight`);

		const { status, unknown } = parseStatus(cell('status'));
		let note = cell('note');
		if (unknown) {
			warn(rowNumber, `Unrecognised status "${cell('status')}" — treated as Scheduled`);
			note = note || cell('status');
		}

		let id = `${division.id}-${round != null ? `r${round}` : slugify(roundLabel) || 'x'}-${[team1, team2]
			.map((s) => slugify(s.name))
			.sort()
			.join('-v-')}`;
		if (fixtureIds.has(id)) {
			let n = 2;
			while (fixtureIds.has(`${id}-${n}`)) n++;
			id = `${id}-${n}`;
		}
		fixtureIds.add(id);

		fixtures.push({
			id,
			round,
			roundLabel,
			division,
			date,
			start,
			end,
			startMinutes,
			endMinutes,
			fieldId: field?.id ?? null,
			fieldLabel: field?.label ?? (fieldRaw || null),
			team1,
			team2,
			isBye,
			status,
			note
		});
	}

	// A team's headline colour is whatever it's listed as most often
	for (const [id, votes] of teamColourVotes) {
		const ranked = [...votes.values()].sort((a, b) => b.count - a.count);
		const team = teams.get(id)!;
		team.colour = ranked[0].colour;
		if (ranked.length > 1) {
			warnings.push({ row: 0, message: `${team.name} (${team.division.name}) is listed in ${ranked.length} colours: ${ranked.map((r) => r.colour.name).join(', ')}` });
		}
	}
	// Fill blank fixture colours from the team's usual colour
	for (const f of fixtures) {
		for (const s of [f.team1, f.team2]) if (s.team && !s.colour.name) s.colour = s.team.colour;
	}

	return {
		fixtures,
		teams: [...teams.values()].sort((a, b) => compareDivisions(a.division, b.division) || a.name.localeCompare(b.name)),
		divisions: [...divisions.values()].sort(compareDivisions),
		warnings
	};
}
