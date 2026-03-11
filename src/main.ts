import { Plugin } from 'obsidian';
import { ActivityCalendarSettings } from './types';
import { DEFAULT_SETTINGS, ActivityCalendarSettingTab } from './settings';
import { CalendarView, VIEW_TYPE_CALENDAR } from './ui/calendarView';
import { registerCommands } from './commands/index';

export default class ActivityCalendarPlugin extends Plugin {
	settings: ActivityCalendarSettings;

	async onload(): Promise<void> {
		await this.loadSettings();

		// Register the sidebar calendar view
		this.registerView(
			VIEW_TYPE_CALENDAR,
			(leaf) => new CalendarView(leaf, this),
		);

		// Ribbon icon to open/reveal the calendar
		this.addRibbonIcon('calendar', 'Activity calendar', () => {
			void this.activateView();
		});

		// Settings tab
		this.addSettingTab(new ActivityCalendarSettingTab(this.app, this));

		// Commands
		registerCommands(this, this);

		// Refresh calendar on vault events (note created/deleted/renamed)
		this.registerEvent(this.app.vault.on('create', () => this.refreshCalendar()));
		this.registerEvent(this.app.vault.on('delete', () => this.refreshCalendar()));
		this.registerEvent(this.app.vault.on('rename', () => this.refreshCalendar()));
		this.registerEvent(this.app.metadataCache.on('changed', () => this.refreshCalendar()));

		// Open the view on first load
		this.app.workspace.onLayoutReady(() => {
			void this.activateView();
		});
	}

	onunload(): void {
		// Obsidian handles cleanup of registered events and views automatically
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<ActivityCalendarSettings>);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		this.refreshCalendar();
	}

	private refreshCalendar(): void {
		for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_CALENDAR)) {
			if (leaf.view instanceof CalendarView) {
				leaf.view.refreshSettings();
			}
		}
	}

	private async activateView(): Promise<void> {
		const { workspace } = this.app;

		let leaf = workspace.getLeavesOfType(VIEW_TYPE_CALENDAR)[0];
		if (!leaf) {
			const rightLeaf = workspace.getRightLeaf(false);
			if (rightLeaf) {
				leaf = rightLeaf;
				await leaf.setViewState({ type: VIEW_TYPE_CALENDAR, active: true });
			}
		}

		if (leaf) {
			void workspace.revealLeaf(leaf);
		}
	}
}
