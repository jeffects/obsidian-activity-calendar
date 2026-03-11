import { App, TFile, WorkspaceLeaf } from 'obsidian';
import { PeriodType, ActivityCalendarSettings } from '../types';
import { formatDate } from './dateFormat';
import { substituteVariables } from './variables';

export type SplitDirection = 'horizontal' | 'vertical' | null;

/**
 * Returns the expected vault file path for a periodic note of the given
 * type and date, using the configured nameTemplate and folder.
 */
export function getNotePath(
	type: PeriodType,
	date: Date,
	settings: ActivityCalendarSettings,
	app: App,
): string {
	const periodSettings = settings[type];
	const nameTemplate = periodSettings.nameTemplate;
	const resolvedName = nameTemplate.includes('{{')
		? substituteVariables(nameTemplate, date, app)
		: formatDate(date, nameTemplate);
	const fileName = resolvedName + '.md';
	const folder = substituteVariables(periodSettings.folder, date, app).trim();
	return folder ? `${folder}/${fileName}` : fileName;
}

/**
 * Opens or creates a periodic note for the given type and date.
 *
 * @param forceCreate  If true, always create the note even if it doesn't exist.
 * @param split        If set, open in a new split pane.
 */
export async function openPeriodicNote(
	type: PeriodType,
	date: Date,
	settings: ActivityCalendarSettings,
	app: App,
	forceCreate: boolean,
	split: SplitDirection = null,
): Promise<void> {
	const filePath = getNotePath(type, date, settings, app);
	let file = app.vault.getAbstractFileByPath(filePath);

	if (!(file instanceof TFile)) {
		if (!forceCreate && settings.useModifierKeyToCreateNote) {
			// Plain click + useModifierKeyToCreateNote → only open existing
			return;
		}

		// Ensure parent folder exists
		const lastSlash = filePath.lastIndexOf('/');
		if (lastSlash !== -1) {
			const folder = filePath.slice(0, lastSlash);
			if (!app.vault.getAbstractFileByPath(folder)) {
				await app.vault.createFolder(folder);
			}
		}

		// Build content from template if configured
		let content = '';
		const periodSettings = settings[type];
		if (periodSettings.templateFile) {
			const candidates = [
				periodSettings.templateFile,
				periodSettings.templateFile + '.md',
			];
			for (const candidate of candidates) {
				const tpl = app.vault.getAbstractFileByPath(candidate);
				if (tpl instanceof TFile) {
					const raw = await app.vault.read(tpl);
					content = substituteVariables(raw, date, app);
					break;
				}
			}
		}

		file = await app.vault.create(filePath, content);
	}

	if (!(file instanceof TFile)) return;

	let leaf: WorkspaceLeaf | null = null;
	if (split === 'horizontal' || split === 'vertical') {
		const direction = split === 'horizontal' ? 'horizontal' : 'vertical';
		leaf = app.workspace.getLeaf('split', direction);
	} else {
		leaf = app.workspace.getMostRecentLeaf() ?? app.workspace.getLeaf(false);
	}

	if (leaf) {
		await leaf.openFile(file);
	}
}

/**
 * Deletes the periodic note for the given type and date, if it exists.
 * Returns true if a file was deleted.
 */
export async function deletePeriodicNote(
	type: PeriodType,
	date: Date,
	settings: ActivityCalendarSettings,
	app: App,
): Promise<boolean> {
	const filePath = getNotePath(type, date, settings, app);
	const file = app.vault.getAbstractFileByPath(filePath);
	if (!(file instanceof TFile)) return false;
	await app.fileManager.trashFile(file);
	return true;
}
