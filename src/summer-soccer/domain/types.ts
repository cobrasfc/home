// Internal, normalised shapes. UI code only ever sees these — never raw spreadsheet strings.

/** A calendar date at the ground (Australia/Sydney), independent of the viewer's device timezone. */
export interface CivilDate {
	year: number;
	month: number; // 1–12
	day: number;
}

export interface Colour {
	/** Display name, tidied (e.g. "Sky Blue"). Empty when the sheet left it blank. */
	name: string;
	/** CSS colour for the swatch, or null when the name isn't one we recognise (text is still shown). */
	swatch: string | null;
	/** Second colour for two-colour kits ("Blue and Yellow"): the swatch is drawn half and half */
	swatch2?: string;
}

export type DivisionGroup = 'junior' | 'senior';

export interface Division {
	id: string;
	name: string;
	group: DivisionGroup;
	/** Sort key within its group (juniors by youngest age first). */
	order: number;
}

export interface Team {
	/** Stable slug: `<division-slug>-<team-slug>`, e.g. "all-age-mixed-grasshoppers". Used in URLs + storage. */
	id: string;
	name: string;
	division: Division;
	/** Most common colour this team is listed in. */
	colour: Colour;
}

export type FixtureStatus = 'scheduled' | 'cancelled' | 'postponed';

export interface FixtureSide {
	team: Team | null; // null for a bye
	name: string;
	colour: Colour;
}

export interface Fixture {
	/** Stable key (division + round + both teams) — used for de-duplication and calendar UIDs. */
	id: string;
	round: number | null;
	roundLabel: string;
	division: Division;
	date: CivilDate | null;
	/** Absolute instants. Null when the sheet is missing a date or time. */
	start: Date | null;
	end: Date | null;
	/** Minutes after midnight, Sydney time — kept for display without re-deriving from instants. */
	startMinutes: number | null;
	endMinutes: number | null;
	fieldId: string | null;
	/** Label to show: the canonical field name, or the raw text if it didn't match a known field. */
	fieldLabel: string | null;
	team1: FixtureSide;
	team2: FixtureSide;
	isBye: boolean;
	status: FixtureStatus;
	note: string;
}

export interface ParseWarning {
	row: number; // 1-based spreadsheet row (header is row 1)
	message: string;
}

export interface Schedule {
	fixtures: Fixture[];
	teams: Team[];
	divisions: Division[];
	warnings: ParseWarning[];
}
