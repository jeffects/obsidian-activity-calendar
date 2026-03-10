import { FirstDayOfWeek, WeekData, DayData, WeekNumberStandard } from '../types';
import { getISOWeek, getISOWeekYear, getUSWeek, getQuarter } from './dateFormat';

/** Returns the day-of-week index (0=Mon … 6=Sun) for the first column. */
function weekStartIndex(firstDayOfWeek: FirstDayOfWeek): number {
	return firstDayOfWeek === 'Monday' ? 1 : 0; // JS getDay(): 0=Sun, 1=Mon, …
}

/**
 * Computes the first calendar cell date (top-left of the 6×7 grid).
 * We find the first day of the month, then go back to the nearest
 * firstDayOfWeek-aligned date.
 */
function firstCellDate(viewDate: Date, firstDayOfWeek: FirstDayOfWeek): Date {
	const firstOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
	const dow = firstOfMonth.getDay(); // 0=Sun…6=Sat
	const startDow = weekStartIndex(firstDayOfWeek); // 0 or 1

	// How many days to go back to reach the start of the week?
	let offset = (dow - startDow + 7) % 7;
	const result = new Date(firstOfMonth);
	result.setDate(result.getDate() - offset);
	return result;
}

/**
 * Returns the ISO week number for a given date.
 * For US standard, falls back to getUSWeek.
 */
function weekNumber(date: Date, standard: WeekNumberStandard): number {
	return standard === 'ISO 8601' ? getISOWeek(date) : getUSWeek(date);
}

/**
 * Returns the "week year" — the year that the week number belongs to.
 * For ISO this can differ from the calendar year (weeks 52/53 crossing year).
 */
function weekYear(date: Date, standard: WeekNumberStandard): number {
	if (standard === 'ISO 8601') return getISOWeekYear(date);
	return date.getFullYear();
}

/**
 * Generates the 6 rows (weeks) displayed in the calendar for a given viewDate.
 *
 * The "current month" is determined by viewDate.getMonth().
 * Navigation by week: caller passes a viewDate shifted by ±7 days.
 * Navigation by month: caller passes the 1st of the target month.
 *
 * @param viewDate      Any date within the month to display.
 * @param firstDayOfWeek  Which day starts each week.
 * @param weekStandard  Week numbering standard (ISO or US).
 * @returns             An array of exactly 6 WeekData entries.
 */
export function generateCalendarWeeks(
	viewDate: Date,
	firstDayOfWeek: FirstDayOfWeek,
	weekStandard: WeekNumberStandard,
): WeekData[] {
	const currentMonth = viewDate.getMonth();
	const cellDate = firstCellDate(viewDate, firstDayOfWeek);

	const weeks: WeekData[] = [];

	for (let row = 0; row < 6; row++) {
		const weekStart = new Date(cellDate);
		weekStart.setDate(cellDate.getDate() + row * 7);

		// Representative date for this row: the Monday (or Sunday) that starts it
		const repDate = weekStart;
		const wNum = weekNumber(repDate, weekStandard);
		const wYear = weekYear(repDate, weekStandard);
		const wMonth = repDate.getMonth();
		const wQuarter = getQuarter(repDate);

		const days: DayData[] = [];
		for (let col = 0; col < 7; col++) {
			const dayDate = new Date(weekStart);
			dayDate.setDate(weekStart.getDate() + col);
			days.push({
				date: dayDate,
				isCurrentMonth: dayDate.getMonth() === currentMonth,
			});
		}

		weeks.push({
			weekNumber: wNum,
			month: wMonth,
			quarter: wQuarter,
			year: wYear,
			days,
		});
	}

	return weeks;
}

/**
 * Returns the ordered weekday abbreviations for the calendar header,
 * starting from the configured firstDayOfWeek.
 */
export function getWeekdayHeaders(firstDayOfWeek: FirstDayOfWeek): string[] {
	const all = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	const start = firstDayOfWeek === 'Monday' ? 1 : 0;
	return [...all.slice(start), ...all.slice(0, start)];
}

/**
 * Returns { start, end } covering the entire period:
 *   daily   → just that day
 *   weekly  → the 7-day row containing the date
 *   monthly → the whole calendar month
 *   quarterly → the 3 months of the quarter
 *   yearly  → the whole calendar year
 */
export function getDateRangeForPeriod(
	type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly',
	date: Date,
	firstDayOfWeek: FirstDayOfWeek,
): { start: Date; end: Date } {
	const y = date.getFullYear();
	const m = date.getMonth();

	switch (type) {
		case 'daily':
			return {
				start: new Date(y, m, date.getDate()),
				end: new Date(y, m, date.getDate(), 23, 59, 59, 999),
			};
		case 'weekly': {
			const startDow = firstDayOfWeek === 'Monday' ? 1 : 0;
			const dow = date.getDay();
			const daysBack = (dow - startDow + 7) % 7;
			const start = new Date(y, m, date.getDate() - daysBack);
			const end = new Date(start);
			end.setDate(start.getDate() + 6);
			end.setHours(23, 59, 59, 999);
			return { start, end };
		}
		case 'monthly':
			return {
				start: new Date(y, m, 1),
				end: new Date(y, m + 1, 0, 23, 59, 59, 999),
			};
		case 'quarterly': {
			const qStart = Math.floor(m / 3) * 3;
			return {
				start: new Date(y, qStart, 1),
				end: new Date(y, qStart + 3, 0, 23, 59, 59, 999),
			};
		}
		case 'yearly':
			return {
				start: new Date(y, 0, 1),
				end: new Date(y, 11, 31, 23, 59, 59, 999),
			};
	}
}
