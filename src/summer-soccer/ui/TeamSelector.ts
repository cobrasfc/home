// Choose division → choose team → optionally add more → confirm. No accounts; the choice is remembered on this
// device and encoded in the URL.
import type { Division, Schedule, Team } from '../domain/types';
import { esc } from '../utils/html';
import { colourName, swatch } from './bits';

export interface PickerState {
	draft: string[];
	divisionId: string | null;
	notice: string | null;
	/** True when the person already has teams and is editing them (shows Cancel) */
	editing: boolean;
}

function divisionButtons(divisions: Division[], state: PickerState, draftTeams: Team[]): string {
	const groups = [
		{ key: 'junior', label: 'Juniors' },
		{ key: 'senior', label: 'Seniors' }
	] as const;
	return groups
		.map(({ key, label }) => {
			const inGroup = divisions.filter((d) => d.group === key);
			if (!inGroup.length) return '';
			return `<div class="ss-picker__group" role="group" aria-label="${label}">
				<p class="ss-picker__grouplabel">${label}</p>
				<div class="ss-chips">${inGroup
					.map((d) => {
						const count = draftTeams.filter((t) => t.division.id === d.id).length;
						const pressed = state.divisionId === d.id;
						return `<button type="button" class="ss-chip" data-action="pick-division" data-division="${esc(d.id)}" aria-pressed="${pressed}">
							${esc(d.name)}${count ? `<span class="ss-chip__count" aria-label="${count} selected">✓</span>` : ''}
						</button>`;
					})
					.join('')}</div>
			</div>`;
		})
		.join('');
}

export function TeamSelector(schedule: Schedule, state: PickerState): string {
	const draftTeams = state.draft
		.map((id) => schedule.teams.find((t) => t.id === id))
		.filter((t): t is Team => !!t);
	const division = schedule.divisions.find((d) => d.id === state.divisionId) ?? null;
	const teamsInDivision = division ? schedule.teams.filter((t) => t.division.id === division.id) : [];

	const selected = draftTeams.length
		? `<div class="ss-picker__selected" aria-live="polite">
				<p class="ss-picker__label">Following</p>
				<ul class="ss-selected">${draftTeams
					.map(
						(t) => `<li class="ss-selected__item">${swatch(t.colour)}<span><strong>${esc(t.name)}</strong> · ${esc(t.division.name)}</span>
							<button type="button" class="ss-selected__remove" data-action="toggle-team" data-team="${esc(t.id)}" aria-label="Remove ${esc(t.name)} (${esc(t.division.name)})">✕</button></li>`
					)
					.join('')}</ul>
				<p class="ss-fineprint">Play in more than one team, or following a couple of kids? Pick another division and add them too — all games merge into one schedule.</p>
			</div>`
		: '';

	const teamStep = division
		? `<fieldset class="ss-picker__step">
				<legend class="ss-picker__label"><span class="ss-step">2</span> Choose your team in ${esc(division.name)}</legend>
				<div class="ss-teams">${teamsInDivision
					.map((t) => {
						const on = state.draft.includes(t.id);
						return `<button type="button" class="ss-teambtn" data-action="toggle-team" data-team="${esc(t.id)}" aria-pressed="${on}">
							${swatch(t.colour, 'lg')}
							<span class="ss-teambtn__text"><span class="ss-teambtn__name">${esc(t.name)}</span><span class="ss-teambtn__colour">${colourName(t.colour)}</span></span>
							<span class="ss-teambtn__check" aria-hidden="true">${on ? '✓' : '+'}</span>
						</button>`;
					})
					.join('')}</div>
			</fieldset>`
		: '';

	return `<section class="ss-picker" aria-labelledby="ss-picker-heading">
		<h1 id="ss-picker-heading" class="ss-picker__title">${state.editing ? 'Change your teams' : 'Find your games'}</h1>
		<p class="ss-picker__intro">Pick the team you play for or follow. We'll remember it on this phone — no sign-up, no login.</p>
		${state.notice ? `<p class="ss-notice" role="alert">${esc(state.notice)}</p>` : ''}
		${selected}
		<fieldset class="ss-picker__step">
			<legend class="ss-picker__label"><span class="ss-step">1</span> Choose a division</legend>
			${divisionButtons(schedule.divisions, state, draftTeams)}
		</fieldset>
		${teamStep}
		<div class="ss-picker__bar">
			${state.editing ? '<button type="button" class="ss-btn ss-btn--ghost" data-action="cancel-picker">Cancel</button>' : ''}
			<button type="button" class="ss-btn ss-btn--primary ss-btn--wide" data-action="confirm-teams" ${draftTeams.length ? '' : 'disabled'}>
				${draftTeams.length ? `Show my games${draftTeams.length > 1 ? ` (${draftTeams.length} teams)` : ''} →` : 'Choose a team to continue'}
			</button>
		</div>
	</section>`;
}
