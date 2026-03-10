import { App } from 'obsidian';
import { formatDate } from './dateFormat';

type DateUnit = 'd' | 'w' | 'm' | 'y';

function applyDateArithmetic(date: Date, arithmetic: string): Date {
	const match = arithmetic.match(/^([+-])([dwmy])(\d+)$/);
	if (!match) return date;
	const [, sign, unit, amountStr] = match;
	const amount = parseInt(amountStr ?? '0') * (sign === '+' ? 1 : -1);
	const result = new Date(date);
	switch (unit as DateUnit) {
		case 'd': result.setDate(result.getDate() + amount); break;
		case 'w': result.setDate(result.getDate() + amount * 7); break;
		case 'm': result.setMonth(result.getMonth() + amount); break;
		case 'y': result.setFullYear(result.getFullYear() + amount); break;
	}
	return result;
}

/**
 * Substitutes template variables in a string:
 *  - {{date:FORMAT}}           → period date formatted
 *  - {{date:FORMAT:+d7}}       → period date with arithmetic, formatted
 *  - {{today:FORMAT}}          → today's date formatted
 *  - {{today:FORMAT:+d7}}      → today's date with arithmetic, formatted
 *  - {{title}}                 → active file basename
 */
export function substituteVariables(
	template: string,
	periodDate: Date,
	app: App,
): string {
	// {{date:FORMAT}} and {{date:FORMAT:ARITHMETIC}}
	let result = template.replace(
		/\{\{date:([^:}]+)(?::([^}]+))?\}\}/g,
		(_, format: string, arithmetic: string | undefined) => {
			let d = periodDate;
			if (arithmetic) d = applyDateArithmetic(d, arithmetic.trim());
			return formatDate(d, format.trim());
		},
	);

	// {{today:FORMAT}} and {{today:FORMAT:ARITHMETIC}}
	result = result.replace(
		/\{\{today:([^:}]+)(?::([^}]+))?\}\}/g,
		(_, format: string, arithmetic: string | undefined) => {
			let d = new Date();
			if (arithmetic) d = applyDateArithmetic(d, arithmetic.trim());
			return formatDate(d, format.trim());
		},
	);

	// {{title}}
	result = result.replace(/\{\{title\}\}/g, () => {
		const activeFile = app.workspace.getActiveFile();
		return activeFile ? activeFile.basename : '';
	});

	return result;
}
