import { Plugin, TFile } from 'obsidian';
import { ActivityCalendarSettings } from '../types';
import { CalendarView, VIEW_TYPE_CALENDAR } from '../ui/calendarView';
import { openPeriodicNote } from '../utils/periodicNotes';
import { parseDate } from '../utils/dateFormat';

function getCalendarView(plugin: Plugin): CalendarView | null {
	const leaves = plugin.app.workspace.getLeavesOfType(VIEW_TYPE_CALENDAR);
	const leaf = leaves[0];
	if (!leaf) return null;
	return leaf.view instanceof CalendarView ? leaf.view : null;
}

export function registerCommands(plugin: Plugin, settingsRef: { settings: ActivityCalendarSettings }): void {
	// 1. Open today's note
	plugin.addCommand({
		id: 'open-today-note',
		name: "Open today's note",
		callback: async () => {
			await openPeriodicNote('daily', new Date(), settingsRef.settings, plugin.app, false);
		},
	});

	// 2. Open tomorrow's note
	plugin.addCommand({
		id: 'open-tomorrow-note',
		name: "Open tomorrow's note",
		callback: async () => {
			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			await openPeriodicNote('daily', tomorrow, settingsRef.settings, plugin.app, false);
		},
	});

	// 3. Open yesterday's note
	plugin.addCommand({
		id: 'open-yesterday-note',
		name: "Open yesterday's note",
		callback: async () => {
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);
			await openPeriodicNote('daily', yesterday, settingsRef.settings, plugin.app, false);
		},
	});

	// 4. Open weekly note (current week)
	plugin.addCommand({
		id: 'open-weekly-note',
		name: 'Open weekly note',
		callback: async () => {
			await openPeriodicNote('weekly', new Date(), settingsRef.settings, plugin.app, false);
		},
	});

	// 5. Navigate calendar to current week
	plugin.addCommand({
		id: 'navigate-to-current-week',
		name: 'Navigate calendar to current week',
		callback: () => {
			const view = getCalendarView(plugin);
			view?.navigateToday();
		},
	});

	// 6. Navigate to next week
	plugin.addCommand({
		id: 'navigate-next-week',
		name: 'Navigate to next week',
		callback: () => {
			getCalendarView(plugin)?.navigateNextWeek();
		},
	});

	// 7. Navigate to previous week
	plugin.addCommand({
		id: 'navigate-prev-week',
		name: 'Navigate to previous week',
		callback: () => {
			getCalendarView(plugin)?.navigatePrevWeek();
		},
	});

	// 8. Navigate to next month
	plugin.addCommand({
		id: 'navigate-next-month',
		name: 'Navigate to next month',
		callback: () => {
			getCalendarView(plugin)?.navigateNextMonth();
		},
	});

	// 9. Navigate to previous month
	plugin.addCommand({
		id: 'navigate-prev-month',
		name: 'Navigate to previous month',
		callback: () => {
			getCalendarView(plugin)?.navigatePrevMonth();
		},
	});

	// 10. Display active note in calendar
	plugin.addCommand({
		id: 'display-active-note',
		name: 'Display active note in calendar',
		callback: () => {
			const activeFile = plugin.app.workspace.getActiveFile();
			if (!(activeFile instanceof TFile)) return;

			const settings = settingsRef.settings;
			let createdAt: Date | null = null;

			if (settings.useCreatedOnDateFromProperties) {
				const cache = plugin.app.metadataCache.getFileCache(activeFile);
				// frontmatter values are typed as unknown/any in the Obsidian API
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const rawValue = cache?.frontmatter?.[settings.createdOnDatePropertyName];
				const raw: unknown = rawValue;
				if (typeof raw === 'string') {
					createdAt = parseDate(raw, settings.createdOnPropertyFormat);
				}
			}

			if (!createdAt) {
				createdAt = new Date(activeFile.stat.ctime);
			}

			const view = getCalendarView(plugin);
			view?.navigateToDate(createdAt);
		},
	});
}
