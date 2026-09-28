// All schedule maths happens in the ground's timezone, never the device's.
import { SUMMER_SCHEDULE } from '../../site.config';
import type { CivilDate } from '../domain/types';

export const TIME_ZONE = SUMMER_SCHEDULE.timeZone;

export interface ZonedParts extends CivilDate {
	hour: number;
	minute: number;
	/** 0 = Sunday … 6 = Saturday */
	weekday: number;
}

const partsFormatter = new Intl.DateTimeFormat('en-AU', {
	timeZone: TIME_ZONE,
	hourCycle: 'h23',
	year: 'numeric',
	month: 'numeric',
	day: 'numeric',
	hour: 'numeric',
	minute: 'numeric',
	second: 'numeric'
});

/** Wall-clock parts of an instant as seen at the ground. */
export function zonedParts(date: Date): ZonedParts & { second: number } {
	const parts = partsFormatter.formatToParts(date);
	const value = (type: string) => Number(parts.find((p) => p.type === type)?.value);
	const year = value('year');
	const month = value('month');
	const day = value('day');
	return {
		year,
		month,
		day,
		hour: value('hour') % 24,
		minute: value('minute'),
		second: value('second'),
		weekday: new Date(Date.UTC(year, month - 1, day)).getUTCDay()
	};
}

function offsetMs(date: Date): number {
	const p = zonedParts(date);
	const asIfUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
	return asIfUtc - (date.getTime() - date.getUTCMilliseconds());
}

/** The instant at which the ground's clock reads the given wall time (handles daylight saving). */
export function zonedTimeToInstant(date: CivilDate, minutesAfterMidnight: number): Date {
	const guess = Date.UTC(date.year, date.month - 1, date.day, 0, minutesAfterMidnight);
	const first = offsetMs(new Date(guess));
	let instant = guess - first;
	const second = offsetMs(new Date(instant));
	if (second !== first) instant = guess - second;
	return new Date(instant);
}

/** Whole days between two ground-calendar dates (b − a). */
export function daysBetween(a: CivilDate, b: CivilDate): number {
	return Math.round((Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / 86_400_000);
}

export function civilDateOf(date: Date): CivilDate {
	const { year, month, day } = zonedParts(date);
	return { year, month, day };
}

export function weekdayOf(date: CivilDate): number {
	return new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
}
