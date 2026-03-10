/** Returns the ISO week number (1-53) for a given date. */
export function getISOWeek(date: Date): number {
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
	const dayNum = d.getUTCDay() || 7; // Make Sunday = 7
	d.setUTCDate(d.getUTCDate() + 4 - dayNum); // Set to Thursday of the week
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** Returns the year that owns the ISO week containing this date. */
export function getISOWeekYear(date: Date): number {
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
	const dayNum = d.getUTCDay() || 7;
	d.setUTCDate(d.getUTCDate() + 4 - dayNum);
	return d.getUTCFullYear();
}

/** Returns the US week number (1-based, week starts Sunday, week 1 contains Jan 1). */
export function getUSWeek(date: Date): number {
	const startOfYear = new Date(date.getFullYear(), 0, 1);
	const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / 86400000);
	const startDow = startOfYear.getDay(); // 0 = Sunday
	return Math.floor((dayOfYear + startDow) / 7) + 1;
}

/** Returns 1-indexed quarter for a given date. */
export function getQuarter(date: Date): number {
	return Math.floor(date.getMonth() / 3) + 1;
}

function pad(n: number, width = 2): string {
	return String(n).padStart(width, '0');
}

/**
 * Formats a Date using date-fns-like format tokens:
 *   yyyy  yy  MM  M  dd  d  HH  H  mm  ss  ww  w  qqq  Q
 */
export function formatDate(date: Date, format: string): string {
	const isoWeek = getISOWeek(date);
	const quarter = getQuarter(date);
	const calYear = date.getFullYear();

	return format.replace(/yyyy|yy|MM|M|dd|d|HH|H|mm|ss|ww|w|qqq|Q/g, (token) => {
		switch (token) {
			case 'yyyy': return String(calYear);
			case 'yy':   return pad(calYear % 100);
			case 'MM':   return pad(date.getMonth() + 1);
			case 'M':    return String(date.getMonth() + 1);
			case 'dd':   return pad(date.getDate());
			case 'd':    return String(date.getDate());
			case 'HH':   return pad(date.getHours());
			case 'H':    return String(date.getHours());
			case 'mm':   return pad(date.getMinutes());
			case 'ss':   return pad(date.getSeconds());
			case 'ww':   return pad(isoWeek);
			case 'w':    return String(isoWeek);
			case 'qqq':  return `Q${quarter}`;
			case 'Q':    return String(quarter);
			default:     return token;
		}
	});
}

/**
 * Parses a date string using a format string. Supports:
 *   yyyy  MM  dd  HH  mm  ss
 */
export function parseDate(dateStr: string, format: string): Date | null {
	const tokenMap: Array<{ token: string; regex: string; setter: (v: number, parts: number[]) => void }> = [
		{ token: 'yyyy', regex: '(\\d{4})', setter: (v, p) => { p[0] = v; } },
		{ token: 'MM',   regex: '(\\d{2})', setter: (v, p) => { p[1] = v - 1; } },
		{ token: 'dd',   regex: '(\\d{2})', setter: (v, p) => { p[2] = v; } },
		{ token: 'HH',   regex: '(\\d{2})', setter: (v, p) => { p[3] = v; } },
		{ token: 'mm',   regex: '(\\d{2})', setter: (v, p) => { p[4] = v; } },
		{ token: 'ss',   regex: '(\\d{2})', setter: (v, p) => { p[5] = v; } },
	];

	// parts: [year, month(0-idx), day, hours, minutes, seconds]
	const parts = [new Date().getFullYear(), 0, 1, 0, 0, 0];
	const setters: Array<(v: number, p: number[]) => void> = [];

	let regexStr = format.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	for (const { token, regex, setter } of tokenMap) {
		if (regexStr.includes(token)) {
			regexStr = regexStr.replace(token, regex);
			setters.push(setter);
		}
	}

	try {
		const match = dateStr.match(new RegExp(`^${regexStr}$`));
		if (!match) return null;
		setters.forEach((fn, i) => fn(parseInt(match[i + 1] ?? '0'), parts));
		return new Date(parts[0] ?? 2000, parts[1] ?? 0, parts[2] ?? 1, parts[3] ?? 0, parts[4] ?? 0, parts[5] ?? 0);
	} catch {
		return null;
	}
}

/** Checks if two dates represent the same calendar day. */
export function isSameDay(a: Date, b: Date): boolean {
	return a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate();
}

/** Returns midnight (start of day) for a date. */
export function startOfDay(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Returns 23:59:59.999 (end of day) for a date. */
export function endOfDay(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}
