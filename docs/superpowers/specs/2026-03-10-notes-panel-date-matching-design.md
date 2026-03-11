# Notes Panel Date Matching

## Problem

When a periodic note is created for a future date (e.g., clicking March 20 today creates `2026-03-20.md`), the notes panel groups by creation date, so the note appears under today (March 10) instead of March 20.

## Solution

Add a "Match notes by" dropdown setting with two modes:

### Creation date (default, current behavior)

Scans all markdown files in the vault. Shows notes whose creation date (file system `ctime` or frontmatter property) falls within the selected period's date range. No changes to existing logic.

### Period note date

Looks up periodic notes by their configured file path for the selected date. For a selected date, resolves the path for each period type using `getNotePath`:

- **Daily** — the daily note for that date
- **Weekly** — the weekly note for that week
- **Monthly** — the monthly note for that month
- **Quarterly** — the quarterly note for that quarter
- **Yearly** — the yearly note for that year

Only shows entries where the note file exists. Each entry is displayed under a label (Daily, Weekly, etc.) for clarity.

## Changes

### Types (`src/types.ts`)

Add to `ActivityCalendarSettings`:

```ts
notesMatchBy: 'creationDate' | 'periodNoteDate';
```

### Settings (`src/settings.ts`)

- Default: `notesMatchBy: 'creationDate'`
- Add dropdown in "Display notes" section, before the existing "Time format" setting
- Label: "Match notes by"
- Options: "Creation date", "Period note date"

### Calendar View (`src/ui/calendarView.ts`)

- `renderNotesPanel`: Branch on `this.settings.notesMatchBy`
  - `'creationDate'`: Existing logic (unchanged)
  - `'periodNoteDate'`: New method `renderPeriodNotesPanel`
- `renderPeriodNotesPanel`: For each period type (daily, weekly, monthly, quarterly, yearly), resolve path via `getNotePath`, check if file exists, render with a period type label

### Styles (`styles.css`)

- Add `.ac-notes-period-label` for the period type group labels (e.g., "Daily", "Weekly")
