// The hero. Information order is deliberate: when → where → who → what colour → map.
import { fieldById } from '../fields';
import { formatLongDate, formatTime, formatTimeRange, relativeDayLabel } from '../domain/dates';
import { myTeamsIn, perspective } from '../domain/schedule';
import type { Fixture, Team } from '../domain/types';
import { esc } from '../utils/html';
import { colourName, missing, swatch, teamChip } from './bits';
import { FieldMap, MapKey, fieldDescription } from './FieldMap';

function fieldBadge(fixture: Fixture): string {
	const field = fieldById(fixture.fieldId);
	if (field) {
		// "Field 6" / "Minis 2" as real text; split visually into a small word + big number
		const [word, ...rest] = field.label.split(' ');
		return `<p class="ss-fieldbadge"><span class="ss-fieldbadge__word">${esc(word)}</span> <span class="ss-fieldbadge__num">${esc(rest.join(' '))}</span></p>`;
	}
	if (fixture.fieldLabel) return `<p class="ss-fieldbadge ss-fieldbadge--text">${esc(fixture.fieldLabel)}</p>`;
	return `<p class="ss-fieldbadge ss-fieldbadge--tbc"><span class="ss-fieldbadge__word">Field</span> <span class="ss-fieldbadge__num">TBC</span></p>`;
}

export function NextGameCard(fixture: Fixture, teams: Team[], now: Date, isLive: boolean, calendarHtml: string): string {
	const { mine, theirs, bothMine } = perspective(fixture, teams);
	const relative = relativeDayLabel(fixture, now);
	const date = fixture.date ? formatLongDate(fixture.date) : '';
	const time = formatTimeRange(fixture);
	const followsSeveral = teams.length > 1;
	const myTeam = myTeamsIn(fixture, teams)[0];

	const live = isLive && fixture.endMinutes != null
		? `<p class="ss-live"><span class="ss-live__dot" aria-hidden="true"></span>Playing now · finishes ${esc(formatTime(fixture.endMinutes))}</p>`
		: '';

	return `<section class="ss-hero" aria-labelledby="ss-next-heading">
		<div class="ss-hero__top">
			<h2 id="ss-next-heading" class="ss-hero__kicker">Your next game</h2>
			${followsSeveral && myTeam ? teamChip(myTeam) : ''}
		</div>
		${live}
		<div class="ss-hero__whenwhere">
			<div class="ss-hero__when">
				<p class="ss-hero__relative">${esc(relative ?? date)}</p>
				${relative ? `<p class="ss-hero__date">${esc(date)}</p>` : ''}
				<p class="ss-hero__time">${time ? esc(time) : missing('Time TBC')}</p>
			</div>
			${fieldBadge(fixture)}
		</div>

		<div class="ss-matchup">
			<div class="ss-side">
				<p class="ss-side__tag">Your team</p>
				<p class="ss-side__name">${swatch(mine.colour, 'lg')}<span>${esc(mine.name)}</span></p>
				<p class="ss-side__colour">${colourName(mine.colour)}</p>
			</div>
			<p class="ss-matchup__vs" aria-hidden="true">vs</p>
			<div class="ss-side">
				<p class="ss-side__tag">${bothMine ? 'Also your team' : 'Opponent — look for'}</p>
				<p class="ss-side__name">${swatch(theirs.colour, 'lg')}<span>${esc(theirs.name)}</span></p>
				<p class="ss-side__colour">${colourName(theirs.colour)}</p>
			</div>
		</div>

		${fixture.note ? `<p class="ss-hero__note">${esc(fixture.note)}</p>` : ''}

		<figure class="ss-map">
			${FieldMap(fixture.fieldId, fixture.fieldLabel)}
			<figcaption class="ss-map__caption">${esc(fieldDescription(fixture.fieldId, fixture.fieldLabel))}</figcaption>
			${MapKey()}
		</figure>

		<p class="ss-hero__meta">${esc(fixture.division.name)}${fixture.roundLabel ? ` · ${esc(fixture.roundLabel)}` : ''}</p>
		${calendarHtml}
	</section>`;
}

/** Cancellation / postponement / bye that falls before the next game — loud, so nobody turns up for nothing. */
export function AlertCard(fixture: Fixture, teams: Team[], now: Date): string {
	const { mine, theirs } = perspective(fixture, teams);
	const relative = relativeDayLabel(fixture, now);
	const when = [relative, fixture.date ? formatLongDate(fixture.date) : null].filter(Boolean).join(' · ');
	const time = formatTimeRange(fixture);
	const kind = fixture.isBye ? 'bye' : fixture.status;
	const whose = relative ? `${relative}'s game` : 'Game';
	const title = fixture.isBye
		? `No game ${relative ? relative.toLowerCase() : 'this round'} — ${esc(mine.name)} has a bye`
		: `${esc(whose)} is ${fixture.status === 'cancelled' ? 'cancelled' : 'postponed'}`;
	const division = teams.length > 1 ? ` (${esc(fixture.division.name)})` : '';
	return `<section class="ss-alert ss-alert--${kind}" role="status">
		<p class="ss-alert__title"><span aria-hidden="true">${fixture.isBye ? '☕' : fixture.status === 'cancelled' ? '✕' : '⏸'}</span> ${title}</p>
		<p class="ss-alert__body">${esc(when)}${time ? ` · ${esc(time)}` : ''}${fixture.isBye ? division : ` · ${esc(mine.name)} vs ${esc(theirs.name)}${division}`}</p>
		${fixture.note ? `<p class="ss-alert__note">${esc(fixture.note)}</p>` : ''}
	</section>`;
}
