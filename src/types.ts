export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export type SortOrder = 'ascending' | 'descending';

export type FirstDayOfWeek = 'Sunday' | 'Monday';

export type WeekNumberStandard = 'ISO 8601' | 'US';

export interface PeriodSettings {
	nameTemplate: string;
	folder: string;
	templateFile: string;
}

export interface ActivityCalendarSettings {
	// General
	displayNotesCreatedOnDate: boolean;
	displayNoteIndicator: boolean;
	useModifierKeyToCreateNote: boolean;
	firstDayOfWeek: FirstDayOfWeek;
	weekNumberStandard: WeekNumberStandard;

	// Display Notes
	displayDateTemplate: string;
	useCreatedOnDateFromProperties: boolean;
	createdOnDatePropertyName: string;
	createdOnPropertyFormat: string;
	sortNotes: SortOrder;

	// Per period type
	daily: PeriodSettings;
	weekly: PeriodSettings;
	monthly: PeriodSettings;
	quarterly: PeriodSettings;
	yearly: PeriodSettings;
}

export interface WeekData {
	weekNumber: number;
	/** 0-indexed month of the representative day (Monday of the week) */
	month: number;
	/** 1-indexed quarter */
	quarter: number;
	year: number;
	days: DayData[];
}

export interface DayData {
	date: Date;
	isCurrentMonth: boolean;
}

export interface SelectedPeriod {
	type: PeriodType;
	date: Date;
}

export interface TaskIndicators {
	hasUncompleted: boolean;
	hasCompleted: boolean;
}

export interface NoteInfo {
	title: string;
	path: string;
	createdAt: Date;
}
