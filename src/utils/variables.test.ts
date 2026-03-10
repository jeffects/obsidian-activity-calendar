import { describe, test, expect, vi } from 'vitest';
import { App } from 'obsidian';
import { substituteVariables } from './variables';

function createMockApp(activeBasename: string | null = null): App {
	return {
		workspace: {
			getActiveFile: () =>
				activeBasename ? { basename: activeBasename } : null,
		},
	} as unknown as App;
}

describe('substituteVariables', () => {
	const date = new Date(2024, 2, 5, 14, 30); // Mar 5 2024

	test('replaces {{date:FORMAT}} with formatted period date', () => {
		const app = createMockApp();
		expect(substituteVariables('{{date:yyyy-MM-dd}}', date, app)).toBe('2024-03-05');
	});

	test('replaces {{date:FORMAT:ARITHMETIC}} with adjusted date', () => {
		const app = createMockApp();
		// +d7 → Mar 12
		expect(substituteVariables('{{date:yyyy-MM-dd:+d7}}', date, app)).toBe('2024-03-12');
	});

	test('handles date arithmetic: subtract days', () => {
		const app = createMockApp();
		expect(substituteVariables('{{date:yyyy-MM-dd:-d3}}', date, app)).toBe('2024-03-02');
	});

	test('handles date arithmetic: add weeks', () => {
		const app = createMockApp();
		// +w2 → Mar 5 + 14 days = Mar 19
		expect(substituteVariables('{{date:yyyy-MM-dd:+w2}}', date, app)).toBe('2024-03-19');
	});

	test('handles date arithmetic: add months', () => {
		const app = createMockApp();
		expect(substituteVariables('{{date:yyyy-MM-dd:+m1}}', date, app)).toBe('2024-04-05');
	});

	test('handles date arithmetic: add years', () => {
		const app = createMockApp();
		expect(substituteVariables('{{date:yyyy-MM-dd:+y1}}', date, app)).toBe('2025-03-05');
	});

	test('replaces {{today:FORMAT}} with today formatted', () => {
		const app = createMockApp();
		const fakeNow = new Date(2024, 5, 15, 10, 0); // June 15 2024
		vi.useFakeTimers();
		vi.setSystemTime(fakeNow);

		expect(substituteVariables('{{today:yyyy-MM-dd}}', date, app)).toBe('2024-06-15');

		vi.useRealTimers();
	});

	test('replaces {{today:FORMAT:ARITHMETIC}} with adjusted today', () => {
		const app = createMockApp();
		const fakeNow = new Date(2024, 5, 15); // June 15 2024
		vi.useFakeTimers();
		vi.setSystemTime(fakeNow);

		expect(substituteVariables('{{today:yyyy-MM-dd:+d1}}', date, app)).toBe('2024-06-16');

		vi.useRealTimers();
	});

	test('replaces {{title}} with active file basename', () => {
		const app = createMockApp('My Note');
		expect(substituteVariables('{{title}}', date, app)).toBe('My Note');
	});

	test('replaces {{title}} with empty string when no active file', () => {
		const app = createMockApp(null);
		expect(substituteVariables('{{title}}', date, app)).toBe('');
	});

	test('handles multiple variables in one template', () => {
		const app = createMockApp('Note');
		expect(substituteVariables('{{date:yyyy}}/{{title}}', date, app)).toBe('2024/Note');
	});

	test('leaves text without variables unchanged', () => {
		const app = createMockApp();
		expect(substituteVariables('plain text', date, app)).toBe('plain text');
	});

	test('handles invalid arithmetic gracefully (returns original date)', () => {
		const app = createMockApp();
		// Invalid arithmetic format → applyDateArithmetic returns original date
		expect(substituteVariables('{{date:yyyy-MM-dd:invalid}}', date, app)).toBe('2024-03-05');
	});
});
