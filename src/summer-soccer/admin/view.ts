// Shared calculations for the planning portal. Every function works on a plan data file (the live
// scenarios.json or a frozen history snapshot), so the same views render both.
import { GROUND, GROUND_THIRDS } from '../fields';
import type { PlanAssignment } from '../ui/FieldMap';

/* eslint-disable @typescript-eslint/no-explicit-any */
export type PlanData = any;
export type Scenario = any;
export type Wave = any;

// Categorical palette (dataviz reference, slots 1–7 in fixed order) — always paired with a text tag
export const COMP_COLOURS: Record<string, string> = {
	mixed: '#2a78d6',
	aam: '#eb6834',
	aaw: '#1baf7a',
	u67: '#eda100',
	u811: '#e87ba4',
	u1213: '#008300',
	u1418: '#4a3aa7'
};

// Approximate field sizes, assuming ~100 m × 64 m winter pitches split with ~2.8 m alleys
export const FIELD_SIZE: Record<string, string> = { quarters: 'about 49 × 31 m', thirds: 'about 64 × 32 m' };

export const fieldLabel = (id: string) => (id.startsWith('minis') ? `Minis ${id.slice(-1)}` : `Field ${id.split('-')[1]}`);
export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
export const range = (a: number, b: number) => (a === b ? `${a}` : `${a}–${b}`);
export const nightDate = (iso: string) =>
	new Date(`${iso}T12:00:00`).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
export const groundFor = (s: Scenario) => (s.layout === 'thirds' ? GROUND_THIRDS : GROUND);

export function makeView(data: PlanData) {
	const comp: Record<string, any> = Object.fromEntries(data.comps.map((c: any) => [c.id, c]));
	const compName = (id: string) => comp[id]?.name ?? id;
	const weeks: number[] = Array.from({ length: data.weeks }, (_, i) => i + 1);
	const teamComp: Record<string, string> = Object.fromEntries(data.teams.map((t: any) => [t.name, t.comp]));
	const sameComp = (teams: string[]) => new Set(teams.map((t) => teamComp[t])).size === 1;

	/** One round's actual games on a night/wave, as map labels */
	function roundAssignments(s: Scenario, night: string, wave: number, week: number): Record<string, PlanAssignment> {
		const out: Record<string, PlanAssignment> = {};
		for (const f of s.fixtures) {
			if (f.night !== night || f.wave !== wave || f.week !== week) continue;
			out[f.field] = {
				tag: comp[f.comp].short,
				colour: COMP_COLOURS[f.comp],
				match: { team1: f.team1, team2: f.team2, note: f.note.replace(/^Colour clash: /, '') }
			};
		}
		return out;
	}

	function assignments(wave: Wave): Record<string, PlanAssignment> {
		const out: Record<string, PlanAssignment> = {};
		for (const a of wave.allocations) for (const f of a.fields) out[f] = { tag: comp[a.comp].short, colour: COMP_COLOURS[a.comp] };
		return out;
	}

	/** Pitch cells for the strip chart: every main field then the minis, each used-by-comp or free */
	function cells(s: Scenario, wave: Wave) {
		const a = assignments(wave);
		const ids = [...Array.from({ length: s.mainFields }, (_, i) => `field-${i + 1}`), 'minis-1', 'minis-2'];
		return ids.map((id) => ({ id, label: id.startsWith('minis') ? `M${id.slice(-1)}` : id.split('-')[1], use: a[id] ?? null }));
	}
	const cellTitle = (id: string, use: PlanAssignment | null) =>
		`${fieldLabel(id)}: ${use ? compName(Object.keys(comp).find((k) => comp[k].short === use.tag)!) : 'free'}`;

	const usedText = (s: Scenario, w: Wave) => `${range(w.mainUsedMin, w.mainUsedMax)}/${s.mainFields}`;
	const freeText = (s: Scenario, w: Wave) =>
		w.mainUsedMin === s.mainFields ? 'Full' : `${range(s.mainFields - w.mainUsedMax, s.mainFields - w.mainUsedMin)} free`;
	const waveUse = (s: Scenario, night: string) =>
		s.nights.find((n: any) => n.night === night).waves.map((w: Wave) => `W${w.wave} ${usedText(s, w)}`).join(' · ');

	/** Most refereed games on at once on a night (U6/7s use game leaders, not referees) */
	function refsPeak(s: Scenario, night: string) {
		const perSlot = new Map<string, number>();
		for (const f of s.fixtures) {
			if (f.night !== night || f.comp === 'u67') continue;
			const key = `${f.week}-${f.wave}`;
			perSlot.set(key, (perSlot.get(key) ?? 0) + 1);
		}
		return Math.max(0, ...perSlot.values());
	}
	/** Refereed games per wave on a night, e.g. "5 + 4" */
	function refsByWave(s: Scenario, night: string) {
		const waves = s.nights.find((n: any) => n.night === night).waves.map((w: Wave) => w.wave);
		return waves
			.map((w: number) =>
				Math.max(0, ...weeks.map((wk) => s.fixtures.filter((f: any) => f.night === night && f.comp !== 'u67' && f.wave === w && f.week === wk).length))
			)
			.join(' + ');
	}

	/** Shared-contact clashes grouped by the teams involved */
	function contactSummary(s: Scenario) {
		const byTeams = new Map<string, { teams: string[]; weeks: Set<number>; night: string }>();
		for (const c of s.contactClashes) {
			const group = new Set(c.teams);
			const involved = [...new Set((c.games.flat() as string[]).filter((t) => group.has(t)))].sort();
			const key = involved.join(' + ');
			const entry = byTeams.get(key) ?? { teams: involved, weeks: new Set<number>(), night: c.night };
			entry.weeks.add(c.week);
			byTeams.set(key, entry);
		}
		return [...byTeams.values()];
	}

	// Every shared-contact pairing that clashes in any scenario, for the comparison table
	function contactRows() {
		const keys = new Map<string, string[]>();
		for (const s of data.scenarios) for (const c of contactSummary(s)) keys.set(c.teams.join(' + '), c.teams);
		return [...keys.values()].map((teams) => ({
			teams,
			same: sameComp(teams),
			per: data.scenarios.map((s: Scenario) => contactSummary(s).find((c) => c.teams.join(' + ') === teams.join(' + '))?.weeks.size ?? 0)
		}));
	}

	function leaderText(s: Scenario) {
		if (s.gameLeadersByWave?.length) {
			const parts = s.gameLeadersByWave.map((x: any) =>
				x.comps.length ? `${x.comps.map(compName).join(' and ')} teams are resting in Wave ${x.wave}` : `no older junior teams are resting in Wave ${x.wave}`
			);
			const text = parts.join('; ');
			return text.charAt(0).toUpperCase() + text.slice(1);
		}
		return s.gameLeaderComps.length
			? `${s.gameLeaderComps.map(compName).join(', ')} teams are resting (they play the other wave)`
			: 'No older junior teams are resting while the U6/7s play';
	}

	function splitText(s: Scenario) {
		const entries = Object.entries(s.waveSplit as Record<string, any>).filter(([id]) => comp[id]?.night === 'Monday');
		if (!entries.length) return 'Fixed: Mixed always 6:30 pm; Men’s and Women’s always 7:20 pm';
		return `Alternates: each team plays ${Math.min(...entries.map(([, v]) => v.earlyMin))}–${Math.max(...entries.map(([, v]) => v.earlyMax))} of its games at 6:30 pm, the rest at 7:20 pm`;
	}

	return {
		data, comp, compName, weeks, sameComp, roundAssignments, assignments, cells, cellTitle, usedText, freeText, waveUse,
		refsPeak, refsByWave, contactSummary, contactRows, leaderText, splitText
	};
}
