// Ground layout for the coded field map (Metford Sporting Fields, north up).
//
// Built from geometry rather than traced shapes:
// - Two full-size winter pitches, each placed between its two sets of winter goal posts (taken from the club's
//   annotated satellite image). Goals are centred on each end and face each other.
// - Summer fields are exactly one quarter of a winter pitch, separated by a small alley. Fields 1–8 are identical.
// - Minis 1 and 2 are identical, slightly smaller than the main fields, in one line beside the right-hand pitch.
// Units are the satellite image's pixels (1500 × 1430); only relative positions matter.
// To adjust the layout, change PITCH/ALLEY/MINIS below — every field is derived from them.

export interface FieldDef {
	id: string;
	label: string;
	/** Text drawn on the map */
	short: string;
	/** Plain-English position, used as the map's text equivalent ("Field 6 — right-hand block, railway side") */
	area: string;
	/** Extra spellings organisers might type in the sheet (matching ignores case, spaces and punctuation) */
	aliases: string[];
	cx: number;
	cy: number;
	/** Length along the winter pitch's goal-to-goal axis */
	w: number;
	/** Width across the winter pitch */
	h: number;
	/** Clockwise rotation (degrees) that turns the rectangle's w side onto the goal-to-goal axis */
	rotate: number;
}

export interface Landmark {
	kind: 'goal' | 'canteen' | 'railway';
	label: string;
	cx: number;
	cy: number;
	w: number;
	h: number;
	rotate: number;
}

type Point = { x: number; y: number };

/** Winter pitch: official proportions (≈ 100 m × 64 m), same size for both. */
const PITCH = { length: 580, width: 372 };
/** Gap between neighbouring summer fields (and between the pitch and the minis) */
const ALLEY = 16;
/** Minis relative to a main summer field */
const MINIS_SCALE = 0.8;
/** Winter goal net: width × depth */
const GOAL = { width: 46, depth: 14 };

/** Winter goal-post positions from the satellite image; each pitch runs from `a` to `b`. */
const WINTER_PITCHES = {
	left: { a: { x: 398, y: 283 }, b: { x: 256, y: 985 } }, // Fields 1–4: north goal → south goal
	right: { a: { x: 736, y: 538 }, b: { x: 1166, y: 1010 } } // Fields 5–8: north-west goal → south-east goal
};

function frame(p: { a: Point; b: Point }) {
	const centre = { x: (p.a.x + p.b.x) / 2, y: (p.a.y + p.b.y) / 2 };
	const angle = Math.atan2(p.b.y - p.a.y, p.b.x - p.a.x);
	const u = { x: Math.cos(angle), y: Math.sin(angle) }; // along the pitch, a → b
	const n = { x: -u.y, y: u.x }; // across the pitch (u turned 90° clockwise on screen)
	/** Point `along` units from centre towards goal b, `across` units towards the n side */
	const at = (along: number, across: number): Point => ({
		x: centre.x + along * u.x + across * n.x,
		y: centre.y + along * u.y + across * n.y
	});
	return { centre, angle: (angle * 180) / Math.PI, at };
}

const round = (v: number) => Math.round(v * 10) / 10;

// Quarter of a pitch, less half an alley on each inner edge
const QUARTER = { w: (PITCH.length - ALLEY) / 2, h: (PITCH.width - ALLEY) / 2 };
const MINI = { w: QUARTER.w * MINIS_SCALE, h: QUARTER.h * MINIS_SCALE };

type Meta = Pick<FieldDef, 'id' | 'label' | 'short' | 'area' | 'aliases'>;

/** A summer field in one quarter: end -1 = goal a's half, +1 = goal b's half; side ±1 across the pitch. */
function quarter(pitch: ReturnType<typeof frame>, end: -1 | 1, side: -1 | 1, meta: Meta): FieldDef {
	const c = pitch.at(end * (QUARTER.w + ALLEY) / 2, side * (QUARTER.h + ALLEY) / 2);
	return { ...meta, cx: round(c.x), cy: round(c.y), w: round(QUARTER.w), h: round(QUARTER.h), rotate: round(pitch.angle) };
}

function mini(pitch: ReturnType<typeof frame>, end: -1 | 1, side: -1 | 1, meta: Meta): FieldDef {
	const c = pitch.at(end * (MINI.w + ALLEY) / 2, side * (PITCH.width / 2 + ALLEY + MINI.h / 2));
	return { ...meta, cx: round(c.x), cy: round(c.y), w: round(MINI.w), h: round(MINI.h), rotate: round(pitch.angle) };
}

function goals(pitch: ReturnType<typeof frame>): Landmark[] {
	// The goal's open side lies on the goal line and faces the other goal
	return ([-1, 1] as const).map((end) => {
		const c = pitch.at(end * (PITCH.length / 2 + GOAL.depth / 2), 0);
		return {
			kind: 'goal',
			label: 'Winter goal posts',
			cx: round(c.x),
			cy: round(c.y),
			w: GOAL.width,
			h: GOAL.depth,
			rotate: round(pitch.angle + (end === -1 ? -90 : 90))
		};
	});
}

const left = frame(WINTER_PITCHES.left);
const right = frame(WINTER_PITCHES.right);
// For the left pitch the n side is west; for the right pitch it's south-west (away from the railway).

export const GROUND = {
	viewBox: { x: 40, y: 250, w: 1340, h: 1140 },
	fields: [
		quarter(left, -1, 1, { id: 'field-1', label: 'Field 1', short: '1', area: 'left-hand block, top left — by the northern winter goal posts', aliases: ['1', 'f1'] }),
		quarter(left, -1, -1, { id: 'field-2', label: 'Field 2', short: '2', area: 'left-hand block, top right — by the northern winter goal posts', aliases: ['2', 'f2'] }),
		quarter(left, 1, 1, { id: 'field-3', label: 'Field 3', short: '3', area: 'left-hand block, bottom left — closest to the car park', aliases: ['3', 'f3'] }),
		quarter(left, 1, -1, { id: 'field-4', label: 'Field 4', short: '4', area: 'left-hand block, bottom right — by the southern winter goal posts', aliases: ['4', 'f4'] }),
		quarter(right, -1, 1, { id: 'field-5', label: 'Field 5', short: '5', area: 'right-hand block, top left — middle of the ground', aliases: ['5', 'f5'] }),
		quarter(right, -1, -1, { id: 'field-6', label: 'Field 6', short: '6', area: 'right-hand block, top — railway side', aliases: ['6', 'f6'] }),
		quarter(right, 1, 1, { id: 'field-7', label: 'Field 7', short: '7', area: 'right-hand block, bottom — up and to the right of the canteen', aliases: ['7', 'f7'] }),
		quarter(right, 1, -1, { id: 'field-8', label: 'Field 8', short: '8', area: 'right-hand block, far right — railway side, by the winter goal posts', aliases: ['8', 'f8'] }),
		mini(right, -1, 1, { id: 'minis-1', label: 'Minis 1', short: 'Minis 1', area: 'beside Field 5, towards the playground shade sail', aliases: ['mini 1', 'm1', 'minis1', 'mini pitch 1'] }),
		mini(right, 1, 1, { id: 'minis-2', label: 'Minis 2', short: 'Minis 2', area: 'beside Field 7, straight up from the canteen', aliases: ['mini 2', 'm2', 'minis2', 'mini pitch 2'] })
	] satisfies FieldDef[],
	landmarks: [
		{ kind: 'railway', label: 'Railway', cx: 1190, cy: 470, w: 760, h: 0, rotate: 43 },
		{ kind: 'canteen', label: 'Canteen', cx: 890, cy: 1300, w: 200, h: 95, rotate: 6 },
		...goals(left),
		...goals(right)
	] satisfies Landmark[]
};

const key = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const LOOKUP = new Map<string, FieldDef>();
for (const field of GROUND.fields) {
	for (const name of [field.id, field.label, ...field.aliases]) LOOKUP.set(key(name), field);
	// "Field 4", "Field No. 4", "Pitch 4"
	const n = field.label.match(/^Field (\d+)$/)?.[1];
	if (n) for (const prefix of ['field', 'fieldno', 'fieldnumber', 'pitch']) LOOKUP.set(prefix + n, field);
}

export function findField(raw: string): FieldDef | null {
	return LOOKUP.get(key(raw)) ?? null;
}

export function fieldById(id: string | null): FieldDef | null {
	return (id && GROUND.fields.find((f) => f.id === id)) || null;
}
