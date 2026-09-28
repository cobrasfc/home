// Small shared UI pieces.
import { needsOutline } from '../data/colours';
import type { Colour, Fixture, Team } from '../domain/types';
import { esc } from '../utils/html';

/** Colour dot. Decorative — the colour name is always written next to it. */
export function swatch(colour: Colour, size: 'sm' | 'lg' = 'sm'): string {
	const classes = ['ss-swatch', `ss-swatch--${size}`];
	if (!colour.swatch) classes.push('ss-swatch--unknown');
	else if (needsOutline(colour.swatch)) classes.push('ss-swatch--light');
	const style = colour.swatch ? ` style="--swatch:${esc(colour.swatch)}"` : '';
	return `<span class="${classes.join(' ')}"${style} aria-hidden="true"></span>`;
}

export function colourName(colour: Colour): string {
	return colour.name ? esc(colour.name) : 'Colour TBC';
}

export function statusBadge(fixture: Fixture): string {
	if (fixture.isBye) return '<span class="ss-badge ss-badge--bye">Bye</span>';
	if (fixture.status === 'cancelled') return '<span class="ss-badge ss-badge--cancelled"><span aria-hidden="true">✕</span> Cancelled</span>';
	if (fixture.status === 'postponed') return '<span class="ss-badge ss-badge--postponed"><span aria-hidden="true">⏸</span> Postponed</span>';
	return '';
}

/** "Grasshoppers · All Age Mixed" chip — shown when following more than one team. */
export function teamChip(team: Team): string {
	return `<span class="ss-team-chip">${swatch(team.colour)}${esc(team.name)}<span class="ss-team-chip__div">· ${esc(team.division.name)}</span></span>`;
}

export function missing(text: string): string {
	return `<span class="ss-missing">${esc(text)}</span>`;
}
