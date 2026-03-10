import { AbstractInputSuggest, App, Platform, PluginSettingTab, Setting, TFolder } from 'obsidian';
import { ActivityCalendarSettings, FirstDayOfWeek, NotesMatchBy, PeriodType, SortOrder, WeekNumberStandard } from './types';
import ActivityCalendarPlugin from './main';

class FolderSuggest extends AbstractInputSuggest<TFolder> {
	getSuggestions(query: string): TFolder[] {
		const lowerQuery = query.toLowerCase();
		const folders: TFolder[] = [];
		for (const abstractFile of this.app.vault.getAllLoadedFiles()) {
			if (
				abstractFile instanceof TFolder &&
				abstractFile.path.toLowerCase().includes(lowerQuery)
			) {
				folders.push(abstractFile);
			}
		}
		return folders;
	}

	renderSuggestion(folder: TFolder, el: HTMLElement): void {
		el.setText(folder.path);
	}

	selectSuggestion(folder: TFolder): void {
		this.setValue(folder.path);
		this.close();
	}
}

export type { ActivityCalendarSettings };

export const DEFAULT_SETTINGS: ActivityCalendarSettings = {
	// General
	displayNotesCreatedOnDate: false,
	displayNoteIndicator: true,
	boldDaysWithNotes: false,
	highlightIncompleteTasks: true,
	useModifierKeyToCreateNote: false,
	firstDayOfWeek: 'Monday' as FirstDayOfWeek,
	weekNumberStandard: 'ISO 8601' as WeekNumberStandard,

	// Display Notes
	notesMatchBy: 'creationDate' as NotesMatchBy,
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
		new Setting(containerEl).setName('Calendar').setHeading();

		new Setting(containerEl)
			.setName('Show notes created on date')
			.setDesc('Display a panel below the calendar listing notes created during the selected period.')
			.addToggle((t) =>
				t.setValue(this.plugin.settings.displayNotesCreatedOnDate).onChange(async (v) => {
					this.plugin.settings.displayNotesCreatedOnDate = v;
					await this.plugin.saveSettings();
				}),
			);

		const modKey = Platform.isMacOS ? 'Cmd' : 'Ctrl';
		new Setting(containerEl)
			.setName('Require modifier key to create notes')
			.setDesc(`When enabled, a plain click only opens existing notes. Hold ${modKey} or Alt to create a new note. ${modKey}+Alt opens in a horizontal split.`)
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

		// ── Note Indicators ──────────────────────────────────────────────────
		containerEl.createEl('hr');
		new Setting(containerEl).setName("Note indicators").setHeading();

		new Setting(containerEl)
			.setName('Underline days with notes')
			.setDesc('Add an underline to calendar days that have a corresponding periodic note.')
			.addToggle((t) =>
				t.setValue(this.plugin.settings.displayNoteIndicator).onChange(async (v) => {
					this.plugin.settings.displayNoteIndicator = v;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Bold days with notes')
			.setDesc('Bold the day number on calendar days that have a corresponding periodic note.')
			.addToggle((t) =>
				t.setValue(this.plugin.settings.boldDaysWithNotes).onChange(async (v) => {
					this.plugin.settings.boldDaysWithNotes = v;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Highlight incomplete tasks')
			.setDesc('Turn the day number red when the note has uncompleted tasks.')
			.addToggle((t) =>
				t.setValue(this.plugin.settings.highlightIncompleteTasks).onChange(async (v) => {
					this.plugin.settings.highlightIncompleteTasks = v;
					await this.plugin.saveSettings();
				}),
			);

		// ── Display Notes ────────────────────────────────────────────────────
		containerEl.createEl('hr');
		new Setting(containerEl).setName("Display notes").setHeading();

		new Setting(containerEl)
			.setName('Match notes by')
			.setDesc('How to determine which notes appear in the panel for a selected date.')
			.addDropdown((d) =>
				d
					.addOption('creationDate', 'Creation date')
					.addOption('periodNoteDate', 'Period note date')
					.setValue(this.plugin.settings.notesMatchBy)
					.onChange(async (v) => {
						this.plugin.settings.notesMatchBy = v as NotesMatchBy;
						await this.plugin.saveSettings();
					}),
			);

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
				.addText((t) => {
					t.setValue(this.plugin.settings[type].folder).onChange(async (v) => {
						this.plugin.settings[type].folder = v;
						await this.plugin.saveSettings();
					});
					new FolderSuggest(this.app, t.inputEl);
				});

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
