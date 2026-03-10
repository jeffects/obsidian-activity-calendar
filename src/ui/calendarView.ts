import { ItemView, Menu, TFile, WorkspaceLeaf, setIcon } from 'obsidian';
import {
	ActivityCalendarSettings,
	DayData,
	NoteInfo,
	PeriodType,
	SelectedPeriod,
	TaskIndicators,
	WeekData,
} from '../types';
import { generateCalendarWeeks, getDateRangeForPeriod, getWeekdayHeaders } from '../utils/calendar';
import { formatDate, isSameDay, getQuarter } from '../utils/dateFormat';
import {
	deletePeriodicNote,
	getNotePath,
	openPeriodicNote,
	SplitDirection,
} from '../utils/periodicNotes';
import { parseDate, getISOWeek, getISOWeekYear, getUSWeek } from '../utils/dateFormat';

export const VIEW_TYPE_CALENDAR = 'activity-calendar';

export class CalendarView extends ItemView {
	private settings: ActivityCalendarSettings;
	private viewDate: Date;
	private selectedPeriod: SelectedPeriod | null = null;

	constructor(leaf: WorkspaceLeaf, private readonly settingsRef: { settings: ActivityCalendarSettings }) {
		super(leaf);
		this.settings = settingsRef.settings;
		this.viewDate = new Date();
	}

	getViewType(): string { return VIEW_TYPE_CALENDAR; }
	getDisplayText(): string { return 'Activity calendar'; }
	getIcon(): string { return 'calendar'; }

	/** Sync the local settings reference (called by the plugin after settings change). */
	refreshSettings(): void {
		this.settings = this.settingsRef.settings;
		this.render();
	}

	/** Navigate to a specific date (used by commands). */
	navigateTo(date: Date): void {
		this.viewDate = new Date(date);
		this.render();
	}

	async onOpen(): Promise<void> {
		this.render();
	}

	async onClose(): Promise<void> {
		this.contentEl.empty();
	}

	// ─── Rendering ────────────────────────────────────────────────────────────

	render(): void {
		const el = this.contentEl;
		el.empty();
		el.addClass('ac-view');

		const container = el.createDiv('ac-container');

		this.renderHeader(container);
		this.renderGrid(container);

		if (this.settings.displayNotesCreatedOnDate && this.selectedPeriod) {
			this.renderNotesPanel(container);
		}
	}

	// ─── Header ───────────────────────────────────────────────────────────────

	private renderHeader(container: HTMLElement): void {
		const header = container.createDiv('ac-header');

		// Left: month + year (clickable)
		const left = header.createDiv('ac-header-left');

		const monthEl = left.createEl('span', {
			cls: 'ac-header-month',
			text: this.getMonthName(this.viewDate),
		});
		this.applyNoteIndicator(monthEl, 'monthly', this.viewDate);
		if (this.selectedPeriod?.type === 'monthly' &&
			this.selectedPeriod.date.getMonth() === this.viewDate.getMonth() &&
			this.selectedPeriod.date.getFullYear() === this.viewDate.getFullYear()) {
			monthEl.addClass('ac-selected');
		}
		monthEl.addEventListener('click', (e) => this.handlePeriodClick(e, 'monthly', this.viewDate));
		monthEl.addEventListener('contextmenu', (e) => this.showContextMenu(e, 'monthly', this.viewDate));

		const yearEl = left.createEl('span', {
			cls: 'ac-header-year',
			text: String(this.viewDate.getFullYear()),
		});
		this.applyNoteIndicator(yearEl, 'yearly', this.viewDate);
		if (this.selectedPeriod?.type === 'yearly' &&
			this.selectedPeriod.date.getFullYear() === this.viewDate.getFullYear()) {
			yearEl.addClass('ac-selected');
		}
		yearEl.addEventListener('click', (e) => this.handlePeriodClick(e, 'yearly', this.viewDate));
		yearEl.addEventListener('contextmenu', (e) => this.showContextMenu(e, 'yearly', this.viewDate));

		// Right: navigation buttons
		const right = header.createDiv('ac-header-nav');
		this.addNavButton(right, 'chevrons-left', 'Previous month', () => this.navigatePrevMonth());
		this.addNavButton(right, 'chevron-left', 'Previous week', () => this.navigatePrevWeek());
		this.addNavButton(right, 'home', 'Go to current week', () => this.navigateToday());
		this.addNavButton(right, 'chevron-right', 'Next week', () => this.navigateNextWeek());
		this.addNavButton(right, 'chevrons-right', 'Next month', () => this.navigateNextMonth());
	}

	private addNavButton(parent: HTMLElement, icon: string, title: string, onClick: () => void): void {
		const btn = parent.createEl('button', { cls: 'ac-nav-btn', attr: { 'aria-label': title } });
		setIcon(btn, icon);
		btn.addEventListener('click', onClick);
	}

	// ─── Calendar Grid ────────────────────────────────────────────────────────

	private renderGrid(container: HTMLElement): void {
		const weeks = generateCalendarWeeks(
			this.viewDate,
			this.settings.firstDayOfWeek,
			this.settings.weekNumberStandard,
		);

		const table = container.createEl('table', { cls: 'ac-grid' });
		if (weeks.length > 0) {
			this.renderGridHeader(table, weeks[0] as WeekData);
		}
		this.renderGridBody(table, weeks);
	}

	private renderGridHeader(table: HTMLElement, firstWeek: WeekData): void {
		const thead = table.createEl('thead');
		const tr = thead.createEl('tr');

		// Quarter cell — represents the quarter of the view date
		const qDate = this.viewDate;
		const qTh = tr.createEl('th', {
			cls: 'ac-quarter',
			text: `Q${getQuarter(qDate)}`,
			attr: { role: 'button' },
		});
		this.applyNoteIndicator(qTh, 'quarterly', qDate);
		if (this.selectedPeriod?.type === 'quarterly' && this.isSamePeriod('quarterly', qDate)) {
			qTh.addClass('ac-selected');
		}
		qTh.addEventListener('click', (e) => this.handlePeriodClick(e, 'quarterly', qDate));
		qTh.addEventListener('contextmenu', (e) => this.showContextMenu(e, 'quarterly', qDate));

		// Weekday headers
		const weekdays = getWeekdayHeaders(this.settings.firstDayOfWeek);
		for (const day of weekdays) {
			tr.createEl('th', { cls: 'ac-weekday-header', text: day });
		}
	}

	private renderGridBody(table: HTMLElement, weeks: WeekData[]): void {
		const today = new Date();
		const tbody = table.createEl('tbody');

		for (const week of weeks) {
			const tr = tbody.createEl('tr');
			this.renderWeekCell(tr, week);
			for (const day of week.days) {
				this.renderDayCell(tr, day, today);
			}
		}
	}

	private renderWeekCell(tr: HTMLElement, week: WeekData): void {
		const repDate = week.days[0]?.date ?? new Date();
		const td = tr.createEl('td', {
			cls: 'ac-week',
			text: String(week.weekNumber),
			attr: { role: 'button' },
		});
		this.applyNoteIndicator(td, 'weekly', repDate);
		if (this.selectedPeriod?.type === 'weekly' && this.isSamePeriod('weekly', repDate)) {
			td.addClass('ac-selected');
		}
		td.addEventListener('click', (e) => this.handlePeriodClick(e, 'weekly', repDate));
		td.addEventListener('contextmenu', (e) => this.showContextMenu(e, 'weekly', repDate));
	}

	private renderDayCell(tr: HTMLElement, day: DayData, today: Date): void {
		const td = tr.createEl('td', {
			cls: 'ac-day',
			attr: { role: 'button' },
		});

		if (!day.isCurrentMonth) td.addClass('ac-day--outside');
		if (isSameDay(day.date, today)) td.addClass('ac-day--today');
		if (this.selectedPeriod?.type === 'daily' && isSameDay(day.date, this.selectedPeriod.date)) {
			td.addClass('ac-selected');
		}

		td.createEl('span', { cls: 'ac-day-number', text: String(day.date.getDate()) });

		// Underline indicator for note existence
		this.applyNoteIndicator(td, 'daily', day.date);

		// Dot indicators row: note dot + task dot
		const dotsEl = td.createDiv('ac-dots');
		this.renderNoteDot(dotsEl, day.date);
		this.renderTaskDot(dotsEl, day.date);

		// Highlight incomplete tasks
		if (this.settings.highlightIncompleteTasks) {
			this.applyIncompleteTaskHighlight(td, day.date);
		}

		td.addEventListener('click', (e) => this.handleDayClick(e, day.date));
		td.addEventListener('contextmenu', (e) => this.showContextMenu(e, 'daily', day.date));
	}

	// ─── Note / Task Indicators ───────────────────────────────────────────────

	private applyNoteIndicator(el: HTMLElement, type: PeriodType, date: Date): void {
		const path = getNotePath(type, date, this.settings, this.app);
		if (!(this.app.vault.getAbstractFileByPath(path) instanceof TFile)) return;

		if (this.settings.displayNoteIndicator) {
			el.addClass('ac-has-note');
		}
		if (this.settings.boldDaysWithNotes) {
			el.addClass('ac-bold-note');
		}
	}

	private applyIncompleteTaskHighlight(el: HTMLElement, date: Date): void {
		const path = getNotePath('daily', date, this.settings, this.app);
		const file = this.app.vault.getAbstractFileByPath(path);
		if (!(file instanceof TFile)) return;

		const { hasUncompleted } = this.getTaskIndicators(file);
		if (hasUncompleted) {
			el.addClass('ac-day--incomplete');
		}
	}

	private renderNoteDot(container: HTMLElement, date: Date): void {
		const path = getNotePath('daily', date, this.settings, this.app);
		const hasNote = this.app.vault.getAbstractFileByPath(path) instanceof TFile;
		const dot = container.createEl('span', { cls: 'ac-dot' });
		if (hasNote) {
			dot.addClass('ac-dot--note');
		}
	}

	private renderTaskDot(container: HTMLElement, date: Date): void {
		const path = getNotePath('daily', date, this.settings, this.app);
		const file = this.app.vault.getAbstractFileByPath(path);
		const dot = container.createEl('span', { cls: 'ac-dot' });

		if (!(file instanceof TFile)) return;

		const indicators = this.getTaskIndicators(file);
		if (indicators.hasCompleted && !indicators.hasUncompleted) {
			dot.addClass('ac-dot--task-completed');
			dot.setText('✓');
		} else if (indicators.hasUncompleted) {
			dot.addClass('ac-dot--task-uncompleted');
		}
	}

	private getTaskIndicators(file: TFile): TaskIndicators {
		const cache = this.app.metadataCache.getFileCache(file);
		let hasUncompleted = false;
		let hasCompleted = false;

		if (cache?.listItems) {
			for (const item of cache.listItems) {
				if (item.task === ' ') hasUncompleted = true;
				else if (item.task !== undefined && item.task !== '') hasCompleted = true;
			}
		}

		return { hasUncompleted, hasCompleted };
	}

	// ─── Notes Panel ──────────────────────────────────────────────────────────

	private renderNotesPanel(container: HTMLElement): void {
		if (!this.selectedPeriod) return;

		if (this.settings.notesMatchBy === 'periodNoteDate') {
			this.renderPeriodNotesPanel(container);
			return;
		}

		this.renderCreationDateNotesPanel(container);
	}

	private renderCreationDateNotesPanel(container: HTMLElement): void {
		if (!this.selectedPeriod) return;

		const panel = container.createDiv('ac-notes-panel');

		const { start, end } = getDateRangeForPeriod(
			this.selectedPeriod.type,
			this.selectedPeriod.date,
			this.settings.firstDayOfWeek,
		);

		const notes = this.getNotesInRange(start, end);
		const sorted = [...notes].sort((a, b) => {
			const diff = a.createdAt.getTime() - b.createdAt.getTime();
			return this.settings.sortNotes === 'ascending' ? diff : -diff;
		});

		if (sorted.length === 0) {
			panel.createEl('p', { cls: 'ac-notes-empty', text: 'No notes created in this period.' });
			return;
		}

		for (const note of sorted) {
			const item = panel.createDiv('ac-note-item');
			item.createEl('span', { cls: 'ac-note-title', text: note.title });
			item.createEl('span', {
				cls: 'ac-note-date',
				text: formatDate(note.createdAt, this.settings.displayDateTemplate),
			});
			item.createEl('span', { cls: 'ac-note-path', text: note.path });
			this.registerDomEvent(item, 'click', () => {
				const file = this.app.vault.getAbstractFileByPath(note.path);
				if (file instanceof TFile) {
					void this.app.workspace.getLeaf(false).openFile(file);
				}
			});
		}
	}

	private renderPeriodNotesPanel(container: HTMLElement): void {
		if (!this.selectedPeriod) return;

		const panel = container.createDiv('ac-notes-panel');
		const date = this.selectedPeriod.date;
		const periodTypes: Array<{ type: PeriodType; label: string }> = [
			{ type: 'daily', label: 'Daily' },
			{ type: 'weekly', label: 'Weekly' },
			{ type: 'monthly', label: 'Monthly' },
			{ type: 'quarterly', label: 'Quarterly' },
			{ type: 'yearly', label: 'Yearly' },
		];

		let hasAny = false;

		for (const { type, label } of periodTypes) {
			const path = getNotePath(type, date, this.settings, this.app);
			const file = this.app.vault.getAbstractFileByPath(path);
			if (!(file instanceof TFile)) continue;

			hasAny = true;
			panel.createEl('span', { cls: 'ac-notes-period-label', text: label });
			const item = panel.createDiv('ac-note-item');
			item.createEl('span', { cls: 'ac-note-title', text: file.basename });
			item.createEl('span', { cls: 'ac-note-path', text: file.path });
			this.registerDomEvent(item, 'click', () => {
				void this.app.workspace.getLeaf(false).openFile(file);
			});
		}

		if (!hasAny) {
			panel.createEl('p', { cls: 'ac-notes-empty', text: 'No periodic notes for this date.' });
		}
	}

	private getNotesInRange(start: Date, end: Date): NoteInfo[] {
		const notes: NoteInfo[] = [];
		for (const file of this.app.vault.getMarkdownFiles()) {
			const createdAt = this.getNoteCreatedAt(file);
			if (createdAt && createdAt >= start && createdAt <= end) {
				notes.push({ title: file.basename, path: file.path, createdAt });
			}
		}
		return notes;
	}

	private getNoteCreatedAt(file: TFile): Date | null {
		if (this.settings.useCreatedOnDateFromProperties) {
			const cache = this.app.metadataCache.getFileCache(file);
			// frontmatter values are typed as unknown/any in the Obsidian API
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const rawValue = cache?.frontmatter?.[this.settings.createdOnDatePropertyName];
			const raw: unknown = rawValue;
			if (typeof raw === 'string') {
				return parseDate(raw, this.settings.createdOnPropertyFormat);
			}
		}
		return new Date(file.stat.ctime);
	}

	// ─── Interactions ─────────────────────────────────────────────────────────

	private handleDayClick(e: MouseEvent, date: Date): void {
		this.handlePeriodClick(e, 'daily', date);
	}

	private handlePeriodClick(e: MouseEvent, type: PeriodType, date: Date): void {
		e.preventDefault();
		this.selectedPeriod = { type, date };

		const forceCreate = e.altKey || e.ctrlKey || e.metaKey;
		const split: SplitDirection =
			(e.ctrlKey || e.metaKey) && e.altKey ? 'horizontal' : null;

		openPeriodicNote(type, date, this.settings, this.app, forceCreate, split)
			.then(() => this.render())
			.catch((err: unknown) => console.error('[Activity Calendar] Failed to open note:', err));
	}

	private showContextMenu(e: MouseEvent, type: PeriodType, date: Date): void {
		e.preventDefault();
		const menu = new Menu();

		menu.addItem((item) =>
			item
				.setTitle('Open in horizontal split')
				.setIcon('layout-bottom')
				.onClick(async () => {
					this.selectedPeriod = { type, date };
					await openPeriodicNote(type, date, this.settings, this.app, true, 'horizontal');
					this.render();
				}),
		);

		menu.addItem((item) =>
			item
				.setTitle('Open in vertical split')
				.setIcon('layout-sidebar-right')
				.onClick(async () => {
					this.selectedPeriod = { type, date };
					await openPeriodicNote(type, date, this.settings, this.app, true, 'vertical');
					this.render();
				}),
		);

		menu.addItem((item) =>
			item
				.setTitle('Delete note')
				.setIcon('trash')
				.onClick(async () => {
					await deletePeriodicNote(type, date, this.settings, this.app);
					this.render();
				}),
		);

		menu.showAtMouseEvent(e);
	}

	// ─── Navigation ───────────────────────────────────────────────────────────

	navigatePrevMonth(): void {
		this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() - 1, 1);
		this.render();
	}

	navigateNextMonth(): void {
		this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + 1, 1);
		this.render();
	}

	navigatePrevWeek(): void {
		const d = new Date(this.viewDate);
		d.setDate(d.getDate() - 7);
		this.viewDate = d;
		this.render();
	}

	navigateNextWeek(): void {
		const d = new Date(this.viewDate);
		d.setDate(d.getDate() + 7);
		this.viewDate = d;
		this.render();
	}

	navigateToday(): void {
		this.viewDate = new Date();
		this.render();
	}

	/** Navigate to the week/month containing the given date (for "Display active note" command). */
	navigateToDate(date: Date): void {
		this.viewDate = new Date(date);
		this.render();
	}

	// ─── Helpers ──────────────────────────────────────────────────────────────

	private getMonthName(date: Date): string {
		return date.toLocaleString('default', { month: 'long' });
	}

	private isSamePeriod(type: PeriodType, date: Date): boolean {
		if (!this.selectedPeriod) return false;
		const sel = this.selectedPeriod.date;
		switch (type) {
			case 'daily':
				return isSameDay(sel, date);
			case 'weekly':
				return getWeekKey(sel, this.settings.weekNumberStandard) ===
					getWeekKey(date, this.settings.weekNumberStandard);
			case 'monthly':
				return sel.getFullYear() === date.getFullYear() && sel.getMonth() === date.getMonth();
			case 'quarterly':
				return sel.getFullYear() === date.getFullYear() &&
					Math.floor(sel.getMonth() / 3) === Math.floor(date.getMonth() / 3);
			case 'yearly':
				return sel.getFullYear() === date.getFullYear();
		}
	}
}

// ─── Module-level helpers ─────────────────────────────────────────────────────

function getWeekKey(date: Date, standard: string): string {
	if (standard === 'ISO 8601') {
		return `${getISOWeekYear(date)}-W${getISOWeek(date)}`;
	}
	return `${date.getFullYear()}-W${getUSWeek(date)}`;
}
