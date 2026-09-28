// Calendar actions, support, and the loading / error / end-of-season states.
import { SUMMER_SCHEDULE } from '../../site.config';
import { esc } from '../utils/html';

export const SNAPSHOT_NOTE =
	"Calendar events are a snapshot — if the club changes a fixture later, your calendar won't update. Check this page before you head down.";

export function NextGameCalendar(googleUrl: string | null): string {
	return `<div class="ss-cal">
		<button type="button" class="ss-btn ss-btn--light" data-action="calendar-next">
			<span aria-hidden="true">📅</span> Add to calendar
		</button>
		${googleUrl ? `<a class="ss-cal__alt" href="${esc(googleUrl)}" target="_blank" rel="noopener">or add to Google Calendar</a>` : ''}
		<p class="ss-cal__note">Saved events won't update if the fixture changes.</p>
	</div>`;
}

export function AllGamesCalendar(count: number): string {
	if (!count) return '';
	return `<div class="ss-allcal">
		<button type="button" class="ss-btn ss-btn--outline" data-action="calendar-all">
			<span aria-hidden="true">📅</span> Add all ${count} remaining game${count === 1 ? '' : 's'} to calendar
		</button>
		<p class="ss-fineprint">${esc(SNAPSHOT_NOTE)}</p>
	</div>`;
}

export function Support(): string {
	const { email, facebookUrl } = SUMMER_SCHEDULE.support;
	return `<section class="ss-support" aria-labelledby="ss-support-heading">
		<h2 id="ss-support-heading" class="ss-support__title">Something doesn't look right?</h2>
		<p class="ss-support__text">Contact Metford Cobras:</p>
		<div class="ss-support__links">
			${email ? `<a class="ss-btn ss-btn--outline" href="mailto:${esc(email)}?subject=${encodeURIComponent('Summer Soccer schedule')}"><span aria-hidden="true">✉️</span> Email the club</a>` : ''}
			${facebookUrl ? `<a class="ss-btn ss-btn--outline" href="${esc(facebookUrl)}" target="_blank" rel="noopener"><span aria-hidden="true">💬</span> Message us on Facebook</a>` : ''}
		</div>
	</section>`;
}

export function ErrorState(detail: string): string {
	return `<section class="ss-state" role="alert">
		<p class="ss-state__emoji" aria-hidden="true">📡</p>
		<h1 class="ss-state__title">We can't load the schedule right now</h1>
		<p class="ss-state__text">This is usually a connection hiccup. Check your signal and try again.</p>
		<button type="button" class="ss-btn ss-btn--primary" data-action="retry">Try again</button>
		<p class="ss-fineprint">${esc(detail)}</p>
	</section>
	${Support()}`;
}

export function WrapCard(): string {
	return `<section class="ss-wrap" aria-labelledby="ss-wrap-heading">
		<p class="ss-wrap__emoji" aria-hidden="true">⚽</p>
		<h2 id="ss-wrap-heading" class="ss-wrap__title">That's a wrap!</h2>
		<p class="ss-wrap__text">You've completed your ${esc(SUMMER_SCHEDULE.seasonName)} season. Thanks for playing with the Cobras.</p>
	</section>`;
}

export function NoNextGame(): string {
	return `<section class="ss-wrap" aria-labelledby="ss-wrap-heading">
		<p class="ss-wrap__emoji" aria-hidden="true">🗓️</p>
		<h2 id="ss-wrap-heading" class="ss-wrap__title">No game currently scheduled</h2>
		<p class="ss-wrap__text">Your remaining games are waiting on a new date from the club. Check back soon.</p>
	</section>`;
}
