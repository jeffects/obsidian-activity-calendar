import { describe, test, expect } from 'vitest';
import { generateCalendarWeeks, getWeekdayHeaders, getDateRangeForPeriod } from './calendar';

// ── getWeekdayHeaders ────────────────────────────────────────────────────────

describe('getWeekdayHeaders', () => {
	test('starts with Mon when firstDayOfWeek is Monday', () => {
		const headers = getWeekdayHeaders('Monday');
		expect(headers).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
	});

	test('starts with Sun when firstDayOfWeek is Sunday', () => {
		const headers = getWeekdayHeaders('Sunday');
		expect(headers).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
	});
});

// ── generateCalendarWeeks ────────────────────────────────────────────────────

describe('generateCalendarWeeks', () => {
	test('returns exactly 6 weeks', () => {
		const weeks = generateCalendarWeeks(new Date(2024, 2, 1), 'Monday', 'ISO 8601');
		expect(weeks).toHaveLength(6);
	});

	test('each week has exactly 7 days', () => {
		const weeks = generateCalendarWeeks(new Date(2024, 2, 1), 'Monday', 'ISO 8601');
		for (const week of weeks) {
			expect(week.days).toHaveLength(7);
		}
	});

	test('first cell is aligned to Monday when firstDayOfWeek is Monday', () => {
		// March 2024: March 1 is Friday → first cell should be Feb 26 (Monday)
		const weeks = generateCalendarWeeks(new Date(2024, 2, 1), 'Monday', 'ISO 8601');
		const firstDay = weeks[0]!.days[0]!.date;
		expect(firstDay.getDay()).toBe(1); // Monday
		expect(firstDay.getDate()).toBe(26); // Feb 26
		expect(firstDay.getMonth()).toBe(1); // February
	});

	test('first cell is aligned to Sunday when firstDayOfWeek is Sunday', () => {
		// March 2024: March 1 is Friday → first cell should be Feb 25 (Sunday)
		const weeks = generateCalendarWeeks(new Date(2024, 2, 1), 'Sunday', 'ISO 8601');
		const firstDay = weeks[0]!.days[0]!.date;
		expect(firstDay.getDay()).toBe(0); // Sunday
		expect(firstDay.getDate()).toBe(25); // Feb 25
	});

	test('marks days outside the current month', () => {
		const weeks = generateCalendarWeeks(new Date(2024, 2, 1), 'Monday', 'ISO 8601');
		// Feb 26 is outside March
		expect(weeks[0]!.days[0]!.isCurrentMonth).toBe(false);
		// March 1 should be current month (it's Friday = index 4 when week starts Monday)
		expect(weeks[0]!.days[4]!.isCurrentMonth).toBe(true);
		expect(weeks[0]!.days[4]!.date.getDate()).toBe(1);
	});

	test('includes correct ISO week numbers', () => {
		const weeks = generateCalendarWeeks(new Date(2024, 2, 1), 'Monday', 'ISO 8601');
		// Week of Feb 26 is ISO week 9
		expect(weeks[0]!.weekNumber).toBe(9);
	});

	test('includes correct US week numbers', () => {
		const weeks = generateCalendarWeeks(new Date(2024, 2, 1), 'Sunday', 'US');
		expect(weeks[0]!.weekNumber).toBeGreaterThan(0);
	});

	test('includes correct quarter', () => {
		const weeks = generateCalendarWeeks(new Date(2024, 2, 1), 'Monday', 'ISO 8601');
		// Feb 26 is Q1
		expect(weeks[0]!.quarter).toBe(1);
	});

	test('handles month starting on Monday with Monday first day', () => {
		// July 2024 starts on Monday
		const weeks = generateCalendarWeeks(new Date(2024, 6, 1), 'Monday', 'ISO 8601');
		const firstDay = weeks[0]!.days[0]!.date;
		expect(firstDay.getDate()).toBe(1);
		expect(firstDay.getMonth()).toBe(6); // July
		expect(firstDay.getDay()).toBe(1); // Monday
	});

	test('handles month starting on Sunday with Sunday first day', () => {
		// Sept 2024 starts on Sunday
		const weeks = generateCalendarWeeks(new Date(2024, 8, 1), 'Sunday', 'ISO 8601');
		const firstDay = weeks[0]!.days[0]!.date;
		expect(firstDay.getDate()).toBe(1);
		expect(firstDay.getMonth()).toBe(8); // September
		expect(firstDay.getDay()).toBe(0); // Sunday
	});

	test('days are consecutive across weeks', () => {
		const weeks = generateCalendarWeeks(new Date(2024, 2, 1), 'Monday', 'ISO 8601');
		const allDays = weeks.flatMap(w => w.days);
		for (let i = 1; i < allDays.length; i++) {
			const prev = allDays[i - 1]!.date;
			const curr = allDays[i]!.date;
			const diffMs = curr.getTime() - prev.getTime();
			const diffDays = Math.round(diffMs / 86400000);
			expect(diffDays).toBe(1);
		}
	});
});

// ── getDateRangeForPeriod ────────────────────────────────────────────────────

describe('getDateRangeForPeriod', () => {
	describe('daily', () => {
		test('returns start and end of the same day', () => {
			const date = new Date(2024, 2, 5, 14, 30);
			const { start, end } = getDateRangeForPeriod('daily', date, 'Monday');
			expect(start.getDate()).toBe(5);
			expect(start.getHours()).toBe(0);
			expect(end.getDate()).toBe(5);
			expect(end.getHours()).toBe(23);
			expect(end.getMinutes()).toBe(59);
		});
	});

	describe('weekly', () => {
		test('returns Mon-Sun range when firstDayOfWeek is Monday', () => {
			// March 5 2024 is Tuesday
			const date = new Date(2024, 2, 5);
			const { start, end } = getDateRangeForPeriod('weekly', date, 'Monday');
			expect(start.getDay()).toBe(1); // Monday
			expect(start.getDate()).toBe(4); // March 4
			expect(end.getDay()).toBe(0); // Sunday
			expect(end.getDate()).toBe(10); // March 10
		});

		test('returns Sun-Sat range when firstDayOfWeek is Sunday', () => {
			// March 5 2024 is Tuesday
			const date = new Date(2024, 2, 5);
			const { start, end } = getDateRangeForPeriod('weekly', date, 'Sunday');
			expect(start.getDay()).toBe(0); // Sunday
			expect(start.getDate()).toBe(3); // March 3
			expect(end.getDay()).toBe(6); // Saturday
			expect(end.getDate()).toBe(9); // March 9
		});
	});

	describe('monthly', () => {
		test('returns first and last day of the month', () => {
			const date = new Date(2024, 2, 15);
			const { start, end } = getDateRangeForPeriod('monthly', date, 'Monday');
			expect(start.getDate()).toBe(1);
			expect(start.getMonth()).toBe(2);
			expect(end.getDate()).toBe(31); // March has 31 days
			expect(end.getMonth()).toBe(2);
		});

		test('handles February in leap year', () => {
			const date = new Date(2024, 1, 15);
			const { end } = getDateRangeForPeriod('monthly', date, 'Monday');
			expect(end.getDate()).toBe(29); // 2024 is leap year
		});

		test('handles February in non-leap year', () => {
			const date = new Date(2023, 1, 15);
			const { end } = getDateRangeForPeriod('monthly', date, 'Monday');
			expect(end.getDate()).toBe(28);
		});
	});

	describe('quarterly', () => {
		test('Q1: Jan 1 to Mar 31', () => {
			const date = new Date(2024, 1, 15); // Feb
			const { start, end } = getDateRangeForPeriod('quarterly', date, 'Monday');
			expect(start.getMonth()).toBe(0); // Jan
			expect(start.getDate()).toBe(1);
			expect(end.getMonth()).toBe(2); // Mar
			expect(end.getDate()).toBe(31);
		});

		test('Q2: Apr 1 to Jun 30', () => {
			const date = new Date(2024, 4, 15); // May
			const { start, end } = getDateRangeForPeriod('quarterly', date, 'Monday');
			expect(start.getMonth()).toBe(3); // Apr
			expect(end.getMonth()).toBe(5); // Jun
			expect(end.getDate()).toBe(30);
		});

		test('Q3: Jul 1 to Sep 30', () => {
			const date = new Date(2024, 7, 15); // Aug
			const { start, end } = getDateRangeForPeriod('quarterly', date, 'Monday');
			expect(start.getMonth()).toBe(6); // Jul
			expect(end.getMonth()).toBe(8); // Sep
			expect(end.getDate()).toBe(30);
		});

		test('Q4: Oct 1 to Dec 31', () => {
			const date = new Date(2024, 10, 15); // Nov
			const { start, end } = getDateRangeForPeriod('quarterly', date, 'Monday');
			expect(start.getMonth()).toBe(9); // Oct
			expect(end.getMonth()).toBe(11); // Dec
			expect(end.getDate()).toBe(31);
		});
	});

	describe('yearly', () => {
		test('returns Jan 1 to Dec 31', () => {
			const date = new Date(2024, 6, 15);
			const { start, end } = getDateRangeForPeriod('yearly', date, 'Monday');
			expect(start.getMonth()).toBe(0);
			expect(start.getDate()).toBe(1);
			expect(end.getMonth()).toBe(11);
			expect(end.getDate()).toBe(31);
		});
	});
});
