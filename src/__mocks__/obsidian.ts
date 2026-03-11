// Minimal mock of the Obsidian API for unit testing.
// Only types/classes referenced by the tested utility modules need stubs here.

export class App {}
export class TFile {
	basename = '';
	path = '';
	stat = { ctime: 0, mtime: 0, size: 0 };
}
export class TFolder {
	path = '';
}
export class Plugin {}
export class ItemView {
	contentEl = { empty: () => {}, addClass: () => {}, createDiv: () => ({}) };
	app = new App();
	constructor(_leaf: unknown) {}
	getViewType() { return ''; }
	getDisplayText() { return ''; }
	getIcon() { return ''; }
	registerDomEvent() {}
}
export class WorkspaceLeaf {}
export class PluginSettingTab {
	containerEl = { empty: () => {} };
	constructor(_app: App, _plugin: Plugin) {}
}
export class Menu {
	addItem(cb: (item: unknown) => void) { return this; }
	showAtMouseEvent(_e: MouseEvent) {}
}
export class Setting {
	constructor(_el: unknown) {}
	setName(_n: string) { return this; }
	setDesc(_d: string) { return this; }
	setHeading() { return this; }
	addToggle(cb: (t: unknown) => void) { return this; }
	addDropdown(cb: (d: unknown) => void) { return this; }
	addText(cb: (t: unknown) => void) { return this; }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class AbstractInputSuggest<T> {
	app: App;
	constructor(app: App, _inputEl: unknown) { this.app = app; }
	close() {}
	setValue(_v: string) {}
}
export const Platform = { isMacOS: false };
export function setIcon(_el: HTMLElement, _icon: string) {}
