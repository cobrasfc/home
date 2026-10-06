// Coded ground map (SVG), laid out from the satellite image. Every field is drawn; the game's field is highlighted
// with a gentle pulse. Landmarks (canteen, winter goal posts, railway) help people get their bearings.
// The map is never the only place the field is named — the card always says "Field 6" in text too.
import { ACTIVE_GROUND, fieldById, type FieldDef, type Ground, type Landmark } from '../fields';
import { esc } from '../utils/html';

const rotation = (r: { cx: number; cy: number; rotate: number }) => `rotate(${r.rotate} ${r.cx} ${r.cy})`;

/** Halfway line, centre circle and goal boxes, drawn in the field's own (unrotated) frame. */
function pitchMarkings(f: FieldDef): string {
	const x = f.cx - f.w / 2;
	const y = f.cy - f.h / 2;
	const portrait = f.h >= f.w;
	const r = Math.min(f.w, f.h) * 0.14;
	const box = portrait ? { w: f.w * 0.44, h: f.h * 0.11 } : { w: f.w * 0.11, h: f.h * 0.44 };
	const half = portrait
		? `<line x1="${x}" y1="${f.cy}" x2="${x + f.w}" y2="${f.cy}"/>`
		: `<line x1="${f.cx}" y1="${y}" x2="${f.cx}" y2="${y + f.h}"/>`;
	const boxes = portrait
		? `<rect x="${f.cx - box.w / 2}" y="${y}" width="${box.w}" height="${box.h}"/><rect x="${f.cx - box.w / 2}" y="${y + f.h - box.h}" width="${box.w}" height="${box.h}"/>`
		: `<rect x="${x}" y="${f.cy - box.h / 2}" width="${box.w}" height="${box.h}"/><rect x="${x + f.w - box.w}" y="${f.cy - box.h / 2}" width="${box.w}" height="${box.h}"/>`;
	return `<g class="ss-map__lines">${half}<circle cx="${f.cx}" cy="${f.cy}" r="${r}"/>${boxes}</g>`;
}

function landmark(l: Landmark): string {
	const x = l.cx - l.w / 2;
	const y = l.cy - l.h / 2;
	switch (l.kind) {
		case 'railway':
			return `<g class="ss-map__rail" transform="${rotation(l)}">
				<line x1="${x}" y1="${l.cy - 9}" x2="${x + l.w}" y2="${l.cy - 9}"/>
				<line x1="${x}" y1="${l.cy + 9}" x2="${x + l.w}" y2="${l.cy + 9}"/>
				<line class="ss-map__sleepers" x1="${x}" y1="${l.cy}" x2="${x + l.w}" y2="${l.cy}"/>
			</g>`;
		case 'canteen':
			return `<g transform="${rotation(l)}"><rect class="ss-map__canteen" x="${x}" y="${y}" width="${l.w}" height="${l.h}" rx="10"/>
				<text class="ss-map__canteen-label" x="${l.cx}" y="${l.cy}" dominant-baseline="central" text-anchor="middle">${esc(l.label)}</text></g>`;
		case 'goal':
			// Open side faces the pitch (local +y), so the bracket reads like a goal seen from above
			return `<path class="ss-map__goal" transform="${rotation(l)}" d="M${x} ${l.cy + l.h / 2} V${y} H${x + l.w} V${l.cy + l.h / 2}"/>`;
	}
}

export function fieldDescription(fieldId: string | null, fieldLabel: string | null): string {
	const field = fieldById(fieldId);
	if (field) return `${field.label} — ${field.area}`;
	if (fieldLabel) return `${fieldLabel} (not shown on the map)`;
	return 'Field to be confirmed';
}

export function FieldMap(fieldId: string | null, fieldLabel: string | null, idPrefix = 'ss-map'): string {
	const target = fieldById(fieldId);
	const { viewBox: vb } = ACTIVE_GROUND;
	// Draw the highlighted field last so its pulse sits above neighbouring fields
	const ordered = [...ACTIVE_GROUND.fields].sort((a, b) => Number(a.id === target?.id) - Number(b.id === target?.id));
	const fields = ordered
		.map((f) => {
			const isTarget = f.id === target?.id;
			// "Minis 1" is too wide for a mini pitch on one line: small word above a big number
			const [word, num] = f.short.includes(' ') ? f.short.split(' ') : [null, f.short];
			const numSize = word ? (isTarget ? 64 : 52) : isTarget ? 104 : 76;
			const label = word
				? `<text class="ss-map__label" x="${f.cx}" y="${f.cy}" text-anchor="middle"><tspan x="${f.cx}" dy="-0.2em" font-size="${isTarget ? 30 : 26}">${esc(word)}</tspan><tspan x="${f.cx}" dy="1.05em" font-size="${numSize}">${esc(num)}</tspan></text>`
				: `<text class="ss-map__label" x="${f.cx}" y="${f.cy}" font-size="${numSize}" dominant-baseline="central" text-anchor="middle">${esc(num)}</text>`;
			return `<g class="ss-map__field${isTarget ? ' is-target' : ''}">
				<g transform="${rotation(f)}">
					<rect class="ss-map__pitch" x="${f.cx - f.w / 2}" y="${f.cy - f.h / 2}" width="${f.w}" height="${f.h}" rx="10"/>
					${pitchMarkings(f)}
					${isTarget ? `<rect class="ss-map__pulse" x="${f.cx - f.w / 2}" y="${f.cy - f.h / 2}" width="${f.w}" height="${f.h}" rx="12"/>` : ''}
				</g>
				${label}
			</g>`;
		})
		.join('');
	const description = target
		? `Ground map with ${target.label} highlighted: ${target.area}. Fields 1 to 3 run across the left-hand pitch, Fields 4 to 6 across the right-hand pitch with the minis beside it; the canteen is at the bottom and the railway runs along the top right.`
		: fieldLabel
			? `Ground map. ${fieldLabel} isn't on the map, so no field is highlighted.`
			: 'Ground map. The field hasn’t been confirmed yet, so no field is highlighted.';

	return `<svg class="ss-map__svg" viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}" role="img" aria-labelledby="${idPrefix}-title ${idPrefix}-desc" focusable="false">
		<title id="${idPrefix}-title">Ground map</title>
		<desc id="${idPrefix}-desc">${esc(description)}</desc>
		<rect class="ss-map__grass" x="${vb.x}" y="${vb.y}" width="${vb.w}" height="${vb.h}" rx="36"/>
		${ACTIVE_GROUND.landmarks.filter((l) => l.kind !== 'goal').map(landmark).join('')}
		${fields}
		${ACTIVE_GROUND.landmarks.filter((l) => l.kind === 'goal').map(landmark).join('')}
	</svg>`;
}

/** Small key under the map explaining the landmark symbols. */
export function MapKey(): string {
	return `<p class="ss-map__key">
		<span><svg viewBox="0 0 24 14" width="20" height="12" aria-hidden="true"><path class="ss-map__goal" d="M3 13 V2 H21 V13"/></svg> Winter goal posts</span>
		<span><span class="ss-map__key-canteen" aria-hidden="true"></span> Canteen</span>
	</p>`;
}

export interface PlanAssignment {
	/** Short text drawn under the field number, e.g. "AAM" */
	tag: string;
	/** CSS colour identifying the competition (always paired with the text tag) */
	colour: string;
	/** When set, the field shows this match (team names shortened to fit; full names in the hover tooltip) */
	match?: { team1: string; team2: string; note?: string };
}

/** Widest horizontal line through a rotated field's centre — the room available for upright text */
function textRoom(f: FieldDef): number {
	const a = (f.rotate * Math.PI) / 180;
	const cos = Math.abs(Math.cos(a));
	const sin = Math.abs(Math.sin(a));
	return Math.min(cos > 0.01 ? f.w / cos : Infinity, sin > 0.01 ? f.h / sin : Infinity);
}

function fit(text: string, maxChars: number): string {
	return text.length <= maxChars ? text : `${text.slice(0, Math.max(1, maxChars - 1)).trimEnd()}…`;
}

/** Field number + competition, then "Team 1 / v / Team 2", centred on the field */
function matchLabel(f: FieldDef, num: string, a: PlanAssignment): string {
	const base = Math.max(17, Math.min(25, Math.min(f.w, f.h) * 0.13));
	const maxChars = Math.max(6, Math.floor((textRoom(f) * 0.82) / (base * 0.56)));
	const lines = [
		{ text: `${num} · ${a.tag}`, size: base * 0.85, cls: 'ss-plan__mhead' },
		{ text: fit(a.match!.team1, maxChars), size: base, cls: 'ss-plan__mteam' },
		{ text: 'v', size: base * 0.75, cls: 'ss-plan__mv' },
		{ text: fit(a.match!.team2, maxChars), size: base, cls: 'ss-plan__mteam' }
	];
	const lineH = (l: { size: number }) => l.size * 1.18;
	const total = lines.reduce((t, l) => t + lineH(l), 0);
	let y = f.cy - total / 2;
	return lines
		.map((l) => {
			y += lineH(l);
			return `<text class="${l.cls}" x="${f.cx}" y="${(y - l.size * 0.28).toFixed(1)}" font-size="${l.size.toFixed(1)}" text-anchor="middle">${esc(l.text)}</text>`;
		})
		.join('');
}

/**
 * Planning view of the ground: every field drawn, fields in use tinted by competition and tagged in text,
 * unused fields left plain and marked "free". Used by the admin portal to compare layouts.
 */
export function GroundPlan(ground: Ground, assignments: Record<string, PlanAssignment>, title: string, idPrefix: string): string {
	const vb = ground.viewBox;
	const fields = ground.fields
		.map((f) => {
			const a = assignments[f.id];
			const isMini = f.id.startsWith('minis');
			const num = isMini ? `M${f.id.slice(-1)}` : f.short;
			const style = a ? ` style="--plan:${esc(a.colour)}"` : '';
			const size = Math.min(f.w, f.h);
			const numSize = Math.round(size * (isMini ? 0.34 : 0.3));
			const tagSize = Math.round(size * (isMini ? 0.2 : 0.17));
			const tip = a?.match
				? `<title>${esc(`${f.label} · ${a.tag}: ${a.match.team1} v ${a.match.team2}${a.match.note ? ` — ${a.match.note}` : ''}`)}</title>`
				: '';
			const label = a?.match
				? matchLabel(f, num, a)
				: `<text class="ss-plan__num" x="${f.cx}" y="${f.cy - tagSize * 0.35}" font-size="${numSize}" text-anchor="middle">${esc(num)}</text>
				<text class="ss-plan__tag" x="${f.cx}" y="${f.cy + tagSize * 1.25}" font-size="${tagSize}" text-anchor="middle">${esc(a ? a.tag : 'free')}</text>`;
			return `<g class="ss-plan__field${a ? ' is-used' : ''}${a?.match ? ' has-match' : ''}"${style}>${tip}
				<g transform="${rotation(f)}">
					<rect class="ss-plan__pitch" x="${f.cx - f.w / 2}" y="${f.cy - f.h / 2}" width="${f.w}" height="${f.h}" rx="10"/>
					${pitchMarkings(f)}
				</g>
				${label}
			</g>`;
		})
		.join('');
	const used = ground.fields.filter((f) => assignments[f.id]);
	const desc = used.length
		? `${used
				.map((f) => {
					const a = assignments[f.id];
					return `${f.label}: ${a.tag}${a.match ? ` — ${a.match.team1} v ${a.match.team2}` : ''}`;
				})
				.join('; ')}. Other fields free.`
		: 'No fields in use.';
	return `<svg class="ss-map__svg ss-plan" viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}" role="img" aria-labelledby="${idPrefix}-t ${idPrefix}-d" focusable="false">
		<title id="${idPrefix}-t">${esc(title)}</title>
		<desc id="${idPrefix}-d">${esc(desc)}</desc>
		<rect class="ss-map__grass" x="${vb.x}" y="${vb.y}" width="${vb.w}" height="${vb.h}" rx="36"/>
		${ground.landmarks.filter((l) => l.kind !== 'goal').map(landmark).join('')}
		${fields}
		${ground.landmarks.filter((l) => l.kind === 'goal').map(landmark).join('')}
	</svg>`;
}
