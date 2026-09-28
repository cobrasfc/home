// Compact fixture rows for "Coming up" and "Previous games" — deliberately much quieter than the hero.
import { fieldById } from '../fields';
import { formatShortDate, formatTimeRange } from '../domain/dates';
import { myTeamsIn, perspective } from '../domain/schedule';
import type { Fixture, Team } from '../domain/types';
import { esc } from '../utils/html';
import { colourName, missing, statusBadge, swatch, teamChip } from './bits';

export function FixtureCard(fixture: Fixture, teams: Team[]): string {
	const { mine, theirs } = perspective(fixture, teams);
	const time = formatTimeRange(fixture);
	const field = fieldById(fixture.fieldId)?.label ?? fixture.fieldLabel;
	const followsSeveral = teams.length > 1;
	const myTeam = myTeamsIn(fixture, teams)[0];
	const inactive = fixture.status !== 'scheduled' || fixture.isBye;

	const matchup = fixture.isBye
		? `<p class="ss-item__teams">${esc(mine.name)} — <strong>bye</strong>, no game</p>`
		: `<p class="ss-item__teams"><span class="ss-item__mine">${esc(mine.name)}</span> <span class="ss-item__vs">vs</span>
			<span class="ss-item__theirs">${swatch(theirs.colour)}${esc(theirs.name)}</span>
			<span class="ss-item__colour">(${colourName(theirs.colour)})</span></p>`;

	return `<li class="ss-item${inactive ? ` ss-item--${fixture.isBye ? 'bye' : fixture.status}` : ''}">
		<div class="ss-item__when">
			<p class="ss-item__date">${fixture.date ? esc(formatShortDate(fixture.date)) : missing('Date TBC')}</p>
			<p class="ss-item__time">${time ? esc(time) : fixture.isBye ? '' : missing('Time TBC')}</p>
		</div>
		<div class="ss-item__main">
			<p class="ss-item__meta">${fixture.roundLabel ? `<span>${esc(fixture.roundLabel)}</span>` : ''}${followsSeveral && myTeam ? teamChip(myTeam) : ''}${statusBadge(fixture)}</p>
			${matchup}
			${fixture.note ? `<p class="ss-item__note">${esc(fixture.note)}</p>` : ''}
		</div>
		${fixture.isBye ? '' : `<p class="ss-item__field">${field ? esc(field) : missing('Field TBC')}</p>`}
	</li>`;
}

export function FixtureList(fixtures: Fixture[], teams: Team[], label: string): string {
	return `<ol class="ss-list" aria-label="${esc(label)}">${fixtures.map((f) => FixtureCard(f, teams)).join('')}</ol>`;
}
