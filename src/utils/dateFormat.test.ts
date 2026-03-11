import { describe, test, expect } from 'vitest';
import {
	getISOWeek,
	getISOWeekYear,
	getUSWeek,
	getQuarter,
	formatDate,
	parseDate,
	isSameDay,
	startOfDay,
	endOfDay,
} from './dateFormat';

// ── getISOWeek ───────────────────────────────────────────────────────────────

describe('getISOWeek', () => {
	test('returns week 1 for Jan 4 2024 (Thursday)', () => {
		expect(getISOWeek(new Date(2024, 0, 4))).toBe(1);
	});

	test('returns week 1 for Dec 31 2024 (belongs to ISO week 1 of 2025)', () => {
		// Dec 31, 2024 is a Tuesday — ISO week 1 of 2025
		expect(getISOWeek(new Date(2024, 11, 31))).toBe(1);
	});

	test('returns week 52 for Dec 28 2024 (Saturday)', () => {
		expect(getISOWeek(new Date(2024, 11, 28))).toBe(52);
	});

	test('returns week 1 for Jan 1 2024 (Monday)', () => {
		expect(getISOWeek(new Date(2024, 0, 1))).toBe(1);
	});

	test('returns week 53 for Dec 31 2020 (Thursday, long year)', () => {
		expect(getISOWeek(new Date(2020, 11, 31))).toBe(53);
	});

	test('returns correct week for mid-year date', () => {
		// July 15 2024 (Monday)
		expect(getISOWeek(new Date(2024, 6, 15))).toBe(29);
	});
});

// ── getISOWeekYear ───────────────────────────────────────────────────────────

describe('getISOWeekYear', () => {
	test('returns 2025 for Dec 31 2024 (ISO week 1 of 2025)', () => {
		expect(getISOWeekYear(new Date(2024, 11, 31))).toBe(2025);
	});

	test('returns 2024 for Jan 1 2024 (Monday, week 1 of 2024)', () => {
		expect(getISOWeekYear(new Date(2024, 0, 1))).toBe(2024);
	});

	test('returns 2023 for Jan 1 2023 (Sunday belongs to week 52 of 2022)', () => {
		expect(getISOWeekYear(new Date(2023, 0, 1))).toBe(2022);
	});

	test('returns same year for mid-year date', () => {
		expect(getISOWeekYear(new Date(2024, 6, 15))).toBe(2024);
	});
});

// ── getUSWeek ────────────────────────────────────────────────────────────────

describe('getUSWeek', () => {
	test('returns week 1 for Jan 1 (always week 1 in US standard)', () => {
		expect(getUSWeek(new Date(2024, 0, 1))).toBe(1);
	});

	test('returns week 1 for Jan 6 2024 (Saturday, same week as Jan 1)', () => {
		// Jan 1 2024 is Monday, Jan 6 is Saturday → still week 1
		expect(getUSWeek(new Date(2024, 0, 6))).toBe(1);
	});

	test('returns week 2 for Jan 7 2024 (Sunday, new week starts)', () => {
		expect(getUSWeek(new Date(2024, 0, 7))).toBe(2);
	});
});

// ── getQuarter ───────────────────────────────────────────────────────────────

describe('getQuarter', () => {
	test('returns Q1 for January', () => {
		expect(getQuarter(new Date(2024, 0, 15))).toBe(1);
	});

	test('returns Q1 for March', () => {
		expect(getQuarter(new Date(2024, 2, 31))).toBe(1);
	});

	test('returns Q2 for April', () => {
		expect(getQuarter(new Date(2024, 3, 1))).toBe(2);
	});

	test('returns Q3 for July', () => {
		expect(getQuarter(new Date(2024, 6, 1))).toBe(3);
	});

	test('returns Q4 for December', () => {
		expect(getQuarter(new Date(2024, 11, 31))).toBe(4);
	});
});

// ── formatDate ───────────────────────────────────────────────────────────────

describe('formatDate', () => {
	const date = new Date(2024, 2, 5, 14, 7, 9); // Mar 5 2024, 14:07:09

	test('formats yyyy-MM-dd', () => {
		expect(formatDate(date, 'yyyy-MM-dd')).toBe('2024-03-05');
	});

	test('formats yy', () => {
		expect(formatDate(date, 'yy')).toBe('24');
	});

	test('formats M and d without padding', () => {
		expect(formatDate(date, 'M/d')).toBe('3/5');
	});

	test('formats HH:mm:ss', () => {
		expect(formatDate(date, 'HH:mm:ss')).toBe('14:07:09');
	});

	test('formats H without padding', () => {
		expect(formatDate(date, 'H')).toBe('14');
	});

	test('formats ww (ISO week with padding)', () => {
		expect(formatDate(date, 'ww')).toBe('10');
	});

	test('formats w (ISO week without padding)', () => {
		const jan8 = new Date(2024, 0, 8);
		expect(formatDate(jan8, 'w')).toBe('2');
	});

	test('formats qqq', () => {
		expect(formatDate(date, 'qqq')).toBe('Q1');
	});

	test('formats Q', () => {
		expect(formatDate(date, 'Q')).toBe('1');
	});

	test('preserves literal text around tokens', () => {
		expect(formatDate(date, 'Year: yyyy')).toBe('Year: 2024');
	});

	test('formats combined template yyyy-ww', () => {
		expect(formatDate(date, 'yyyy-ww')).toBe('2024-10');
	});

	test('formats YYYY (ISO week-year) same as yyyy for mid-year', () => {
		expect(formatDate(date, 'YYYY')).toBe('2024');
	});

	test('formats YYYY correctly at year boundary (Dec 31 2024 → ISO week-year 2025)', () => {
		const dec31 = new Date(2024, 11, 31); // Tuesday, ISO week 1 of 2025
		expect(formatDate(dec31, 'YYYY-ww')).toBe('2025-01');
		// Compare: yyyy would give wrong result
		expect(formatDate(dec31, 'yyyy-ww')).toBe('2024-01');
	});
});

// ── parseDate ────────────────────────────────────────────────────────────────

describe('parseDate', () => {
	test('parses yyyy-MM-dd', () => {
		const result = parseDate('2024-03-05', 'yyyy-MM-dd');
		expect(result).not.toBeNull();
		expect(result!.getFullYear()).toBe(2024);
		expect(result!.getMonth()).toBe(2); // 0-indexed
		expect(result!.getDate()).toBe(5);
	});

	test('parses yyyy/MM/dd HH:mm', () => {
		const result = parseDate('2024/03/05 14:30', 'yyyy/MM/dd HH:mm');
		expect(result).not.toBeNull();
		expect(result!.getHours()).toBe(14);
		expect(result!.getMinutes()).toBe(30);
	});

	test('parses yyyy/MM/dd HH:mm:ss', () => {
		const result = parseDate('2024/01/15 09:05:30', 'yyyy/MM/dd HH:mm:ss');
		expect(result).not.toBeNull();
		expect(result!.getSeconds()).toBe(30);
	});

	test('returns null for non-matching string', () => {
		expect(parseDate('not-a-date', 'yyyy-MM-dd')).toBeNull();
	});

	test('returns null for partial match', () => {
		expect(parseDate('2024-03', 'yyyy-MM-dd')).toBeNull();
	});
});

// ── isSameDay ────────────────────────────────────────────────────────────────

describe('isSameDay', () => {
	test('returns true for same day different times', () => {
		const a = new Date(2024, 2, 5, 10, 0);
		const b = new Date(2024, 2, 5, 23, 59);
		expect(isSameDay(a, b)).toBe(true);
	});

	test('returns false for different days', () => {
		const a = new Date(2024, 2, 5);
		const b = new Date(2024, 2, 6);
		expect(isSameDay(a, b)).toBe(false);
	});

	test('returns false for same day different months', () => {
		const a = new Date(2024, 2, 5);
		const b = new Date(2024, 3, 5);
		expect(isSameDay(a, b)).toBe(false);
	});

	test('returns false for same day different years', () => {
		const a = new Date(2024, 2, 5);
		const b = new Date(2025, 2, 5);
		expect(isSameDay(a, b)).toBe(false);
	});
});

// ── startOfDay / endOfDay ────────────────────────────────────────────────────

describe('startOfDay', () => {
	test('returns midnight for a date with time', () => {
		const d = startOfDay(new Date(2024, 2, 5, 14, 30, 45));
		expect(d.getHours()).toBe(0);
		expect(d.getMinutes()).toBe(0);
		expect(d.getSeconds()).toBe(0);
		expect(d.getMilliseconds()).toBe(0);
		expect(d.getDate()).toBe(5);
	});
});

describe('endOfDay', () => {
	test('returns 23:59:59.999 for a date', () => {
		const d = endOfDay(new Date(2024, 2, 5, 8, 0));
		expect(d.getHours()).toBe(23);
		expect(d.getMinutes()).toBe(59);
		expect(d.getSeconds()).toBe(59);
		expect(d.getMilliseconds()).toBe(999);
		expect(d.getDate()).toBe(5);
	});
});
