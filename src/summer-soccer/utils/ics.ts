// RFC 5545 calendar export. Times are written in UTC, which every phone calendar converts to local time.
// These are snapshots — an imported event won't follow later changes to the sheet (the UI says so).
import { SUMMER_SCHEDULE } from '../../site.config';
import { formatLongDate, formatTimeRange } from '../domain/dates';
import { perspective } from '../domain/schedule';
import type { Fixture, Team } from '../domain/types';

function stamp(date: Date): string {
	return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeText(value: string): string {
	return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
}

/** Fold lines longer than 75 octets (continuation lines start with a space). */
function fold(line: string): string {
	const bytes = new TextEncoder();
	if (bytes.encode(line).length <= 75) return line;
	const out: string[] = [];
	let current = '';
	for (const ch of line) {
		if (bytes.encode(current + ch).length > (out.length ? 74 : 75)) {
			out.push(current);
			current = ch;
		} else {
			current += ch;
		}
	}
	out.push(current);
	return out.join('\r\n ');
}

export function eventTitle(fixture: Fixture, teams: Team[]): string {
	const { mine, theirs } = perspective(fixture, teams);
	const field = fixture.fieldLabel ? ` · ${fixture.fieldLabel}` : '';
	return `⚽ ${mine.name} vs ${theirs.name}${field}`;
}

export function venueText(fixture: Fixture): string {
	const where = [SUMMER_SCHEDULE.venue.name, SUMMER_SCHEDULE.venue.address].filter(Boolean).join(', ');
	return [fixture.fieldLabel ?? 'Field TBC', where].filter(Boolean).join(', ');
}

export function eventDetails(fixture: Fixture, teams: Team[], scheduleLink: string, generatedAt: Date): string {
	const { mine, theirs } = perspective(fixture, teams);
	const lines = [
		`${fixture.division.name}${fixture.roundLabel ? ` · ${fixture.roundLabel}` : ''}`,
		`${mine.name}${mine.colour.name ? ` (${mine.colour.name})` : ''} vs ${theirs.name}${theirs.colour.name ? ` (${theirs.colour.name})` : ''}`,
		`${fixture.date ? formatLongDate(fixture.date) : ''} · ${formatTimeRange(fixture) ?? 'Time TBC'}`,
		`Field: ${fixture.fieldLabel ?? 'TBC'}`
	];
	if (theirs.colour.name) lines.push(`Look for the team in ${theirs.colour.name}.`);
	if (fixture.note) lines.push(fixture.note);
	lines.push(
		'',
		`Added from the Metford Cobras Summer Soccer schedule on ${generatedAt.toLocaleDateString('en-AU', { timeZone: SUMMER_SCHEDULE.timeZone })}. ` +
			"Fixtures can change and this event won't update itself — check the live schedule before you head down:",
		scheduleLink
	);
	return lines.join('\n');
}

export function buildIcs(fixtures: Fixture[], teams: Team[], scheduleLink: string, now = new Date()): string {
	const lines = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//Metford Cobras FC//Summer Soccer Schedule//EN',
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		`X-WR-CALNAME:${escapeText(`Cobras ${SUMMER_SCHEDULE.seasonName}`)}`
	];
	const seen = new Set<string>();
	for (const f of fixtures) {
		if (!f.start || !f.end || seen.has(f.id)) continue;
		seen.add(f.id);
		lines.push(
			'BEGIN:VEVENT',
			// Stable UID per fixture: re-importing replaces rather than duplicates in calendars that honour UIDs
			`UID:${f.id}@metfordcobras.com.au`,
			`DTSTAMP:${stamp(now)}`,
			`DTSTART:${stamp(f.start)}`,
			`DTEND:${stamp(f.end)}`,
			`SUMMARY:${escapeText(eventTitle(f, teams))}`,
			`LOCATION:${escapeText(venueText(f))}`,
			`DESCRIPTION:${escapeText(eventDetails(f, teams, scheduleLink, now))}`,
			`URL:${scheduleLink}`,
			'STATUS:CONFIRMED',
			'TRANSP:OPAQUE',
			'END:VEVENT'
		);
	}
	lines.push('END:VCALENDAR');
	return lines.map(fold).join('\r\n') + '\r\n';
}

/** Google Calendar "add event" link — no sign-in to our site needed, just the person's own Google account. */
export function googleCalendarUrl(fixture: Fixture, teams: Team[], scheduleLink: string): string | null {
	if (!fixture.start || !fixture.end) return null;
	const params = new URLSearchParams({
		action: 'TEMPLATE',
		text: eventTitle(fixture, teams),
		dates: `${stamp(fixture.start)}/${stamp(fixture.end)}`,
		location: venueText(fixture),
		details: eventDetails(fixture, teams, scheduleLink, new Date())
	});
	return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadIcs(filename: string, content: string): void {
	const isAppleMobile =
		/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
	if (isAppleMobile) {
		// iOS opens a text/calendar data URL straight into the "Add to Calendar" sheet
		window.location.href = `data:text/calendar;charset=utf-8,${encodeURIComponent(content)}`;
		return;
	}
	const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' }));
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	link.remove();
	setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
