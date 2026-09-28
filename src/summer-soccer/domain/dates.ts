// Human-friendly date/time wording. Always pairs relative words ("Tonight") with the real date.
import type { CivilDate, Fixture } from './types';
import { civilDateOf, daysBetween, weekdayOf, zonedParts } from '../utils/timezone';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
	'January', 'February', 'March', 'April', 'May', 'June',
	'July', 'August', 'September', 'October', 'November', 'December'
];

/** "Monday 19 October" */
export function formatLongDate(date: CivilDate): string {
	return `${WEEKDAYS[weekdayOf(date)]} ${date.day} ${MONTHS[date.month - 1]}`;
}

/** "Mon 19 Oct" */
export function formatShortDate(date: CivilDate): string {
	return `${WEEKDAYS[weekdayOf(date)].slice(0, 3)} ${date.day} ${MONTHS[date.month - 1].slice(0, 3)}`;
}

function clock(minutes: number): { text: string; meridiem: 'am' | 'pm' } {
	const h24 = Math.floor(minutes / 60) % 24;
	const m = minutes % 60;
	const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
	return { text: `${h12}:${String(m).padStart(2, '0')}`, meridiem: h24 < 12 ? 'am' : 'pm' };
}

/** "6:30 pm" */
export function formatTime(minutes: number): string {
	const c = clock(minutes);
	return `${c.text} ${c.meridiem}`;
}

/** "6:30–7:10 pm", "11:30 am–12:10 pm", "6:30 pm" (no finish), or null when there's no start time. */
export function formatTimeRange(fixture: Pick<Fixture, 'startMinutes' | 'endMinutes'>): string | null {
	if (fixture.startMinutes == null) return null;
	if (fixture.endMinutes == null) return formatTime(fixture.startMinutes);
	const a = clock(fixture.startMinutes);
	const b = clock(fixture.endMinutes);
	return a.meridiem === b.meridiem ? `${a.text}–${b.text} ${b.meridiem}` : `${a.text} ${a.meridiem}–${b.text} ${b.meridiem}`;
}

/**
 * Relative wording for a fixture, or null when a plain date reads better.
 * Today → "Tonight" (5 pm or later) / "Today"; tomorrow → "Tomorrow"; within the week → "This Thursday";
 * exactly a week away → "Next Monday". Further out, the date itself is the headline.
 */
export function relativeDayLabel(fixture: Pick<Fixture, 'date' | 'startMinutes'>, now: Date): string | null {
	if (!fixture.date) return null;
	const diff = daysBetween(civilDateOf(now), fixture.date);
	const weekday = WEEKDAYS[weekdayOf(fixture.date)];
	if (diff === 0) return fixture.startMinutes != null && fixture.startMinutes >= 17 * 60 ? 'Tonight' : 'Today';
	if (diff === 1) return 'Tomorrow';
	if (diff >= 2 && diff <= 6) return `This ${weekday}`;
	if (diff === 7) return `Next ${weekday}`;
	return null;
}

/** "19 Oct, 6:02 pm" — for "last updated" notes. */
export function formatStamp(date: Date): string {
	const p = zonedParts(date);
	return `${p.day} ${MONTHS[p.month - 1].slice(0, 3)}, ${formatTime(p.hour * 60 + p.minute)}`;
}
