import { App, PluginSettingTab, Setting } from 'obsidian';
import { ActivityCalendarSettings, FirstDayOfWeek, PeriodType, SortOrder, WeekNumberStandard } from './types';
import ActivityCalendarPlugin from './main';

export type { ActivityCalendarSettings };

export const DEFAULT_SETTINGS: ActivityCalendarSettings = {
	// General
	displayNotesCreatedOnDate: false,
	displayNoteIndicator: true,
	useModifierKeyToCreateNote: false,
	firstDayOfWeek: 'Monday' as FirstDayOfWeek,
	weekNumberStandard: 'ISO 8601' as WeekNumberStandard,

	// Display Notes
	displayDateTemplate: 'HH:mm',
	useCreatedOnDateFromProperties: false,
	createdOnDatePropertyName: 'created_on',
	createdOnPropertyFormat: 'yyyy/MM/dd HH:mm',
	sortNotes: 'ascending' as SortOrder,

	// Per period type
	daily: {
		nameTemplate: 'yyyy-MM-dd',
		folder: 'Daily notes',
		templateFile: 'Templates/Daily note',
	},
	weekly: {
		nameTemplate: 'yyyy-ww',
		folder: 'Weekly notes',
		templateFile: 'Templates/Weekly note',
	},
	monthly: {
		nameTemplate: 'yyyy-MM',
		folder: 'Monthly notes',
		templateFile: 'Templates/Monthly note',
	},
	quarterly: {
		nameTemplate: 'yyyy-qqq',
		folder: 'Quarterly notes',
		templateFile: 'Templates/Quarterly note',
	},
	yearly: {
		nameTemplate: 'yyyy',
		folder: 'Yearly notes',
		templateFile: 'Templates/Yearly note',
	},
};

export class ActivityCalendarSettingTab extends PluginSettingTab {
	plugin: ActivityCalendarPlugin;

	constructor(app: App, plugin: ActivityCalendarPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// ── General ─────────────────────────────────────────────────────────
		;

		new Setting(containerEl)
			.setName('Show notes created on date')
			.setDesc('Display a panel below the calendar listing notes created during the selected period.')
			.addToggle((t) =>
				t.setValue(this.plugin.settings.displayNotesCreatedOnDate).onChange(async (v) => {
					this.plugin.settings.displayNotesCreatedOnDate = v;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Show note indicators')
			.setDesc('Underline calendar cells that have a corresponding periodic note.')
			.addToggle((t) =>
				t.setValue(this.plugin.settings.displayNoteIndicator).onChange(async (v) => {
					this.plugin.settings.displayNoteIndicator = v;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Require modifier key to create notes')
			.setDesc('When enabled, a plain click only opens existing notes; holding a modifier key will create new ones.')
			.addToggle((t) =>
				t.setValue(this.plugin.settings.useModifierKeyToCreateNote).onChange(async (v) => {
					this.plugin.settings.useModifierKeyToCreateNote = v;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('First day of week')
			.addDropdown((d) =>
				d
					.addOption('Monday', 'Monday')
					.addOption('Sunday', 'Sunday')
					.setValue(this.plugin.settings.firstDayOfWeek)
					.onChange(async (v) => {
						this.plugin.settings.firstDayOfWeek = v as FirstDayOfWeek;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Week number standard')
			.addDropdown((d) => {
				// eslint-disable-next-line obsidianmd/ui/sentence-case
				d.addOption('ISO 8601', 'ISO 8601');
				d.addOption('US', 'US');
				d.setValue(this.plugin.settings.weekNumberStandard);
				d.onChange(async (v) => {
					this.plugin.settings.weekNumberStandard = v as WeekNumberStandard;
					await this.plugin.saveSettings();
				});
				return d;
			});

		// ── Display Notes ────────────────────────────────────────────────────
		containerEl.createEl('hr');
		new Setting(containerEl).setName("Display notes").setHeading();

		new Setting(containerEl)
			.setName('Time format')
			// eslint-disable-next-line obsidianmd/ui/sentence-case
			.setDesc('Format for the creation time shown in the notes panel (e.g. HH:mm).')
			.addText((t) =>
				t.setValue(this.plugin.settings.displayDateTemplate).onChange(async (v) => {
					this.plugin.settings.displayDateTemplate = v;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Read creation date from frontmatter')
			.setDesc('Use a frontmatter property to determine a note\'s creation date instead of the file system date.')
			.addToggle((t) =>
				t.setValue(this.plugin.settings.useCreatedOnDateFromProperties).onChange(async (v) => {
					this.plugin.settings.useCreatedOnDateFromProperties = v;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Frontmatter property name')
			.setDesc('Name of the frontmatter property that holds the creation date.')
			.addText((t) =>
				t.setValue(this.plugin.settings.createdOnDatePropertyName).onChange(async (v) => {
					this.plugin.settings.createdOnDatePropertyName = v;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Frontmatter date format')
			.setDesc('Format used to parse the frontmatter creation date property (e.g. yyyy/MM/dd HH:mm).')
			.addText((t) =>
				t.setValue(this.plugin.settings.createdOnPropertyFormat).onChange(async (v) => {
					this.plugin.settings.createdOnPropertyFormat = v;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Sort notes')
			.addDropdown((d) =>
				d
					.addOption('ascending', 'Ascending')
					.addOption('descending', 'Descending')
					.setValue(this.plugin.settings.sortNotes)
					.onChange(async (v) => {
						this.plugin.settings.sortNotes = v as SortOrder;
						await this.plugin.saveSettings();
					}),
			);

		// ── Per period type ──────────────────────────────────────────────────
		const periodTypes: Array<{ type: PeriodType; label: string }> = [
			{ type: 'daily', label: 'Daily notes' },
			{ type: 'weekly', label: 'Weekly notes' },
			{ type: 'monthly', label: 'Monthly notes' },
			{ type: 'quarterly', label: 'Quarterly notes' },
			{ type: 'yearly', label: 'Yearly notes' },
		];

		for (const { type, label } of periodTypes) {
			containerEl.createEl('hr');
			new Setting(containerEl).setName(label).setHeading();

			new Setting(containerEl)
				.setName('Name template')
				.setDesc('Date format pattern for the note filename (e.g. yyyy-MM-dd). Supports {{date:…}} variables.')
				.addText((t) =>
					t.setValue(this.plugin.settings[type].nameTemplate).onChange(async (v) => {
						this.plugin.settings[type].nameTemplate = v;
						await this.plugin.saveSettings();
					}),
				);

			new Setting(containerEl)
				.setName('Folder')
				.setDesc('Vault folder where notes of this type are stored. Supports {{date:…}} variables.')
				.addText((t) =>
					t.setValue(this.plugin.settings[type].folder).onChange(async (v) => {
						this.plugin.settings[type].folder = v;
						await this.plugin.saveSettings();
					}),
				);

			new Setting(containerEl)
				.setName('Template file')
				.setDesc('Path to the template note (without .md extension). Leave blank to create an empty note.')
				.addText((t) =>
					t.setValue(this.plugin.settings[type].templateFile).onChange(async (v) => {
						this.plugin.settings[type].templateFile = v;
						await this.plugin.saveSettings();
					}),
				);
		}
	}
}
