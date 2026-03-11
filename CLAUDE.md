# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Obsidian Activity Calendar is an Obsidian plugin that provides a sidebar calendar view for managing periodic notes (daily, weekly, monthly, quarterly, yearly). It renders a 6-week calendar grid with note indicators, task status dots, and a notes panel.

## Commands

```bash
npm run dev          # Start esbuild watch mode (outputs main.js)
npm run build        # Type-check with tsc then bundle for production
npm run lint         # ESLint (uses eslint-plugin-obsidianmd)
npm run test         # Run vitest once
npm run test:watch   # Run vitest in watch mode
```

Single test file: `npx vitest run src/utils/calendar.test.ts`

## Architecture

**Entry point**: `src/main.ts` — `ActivityCalendarPlugin` extends Obsidian's `Plugin`. Registers the calendar view, ribbon icon, settings tab, commands, and vault event listeners (create/delete/rename/metadata change trigger calendar refresh).

**Key layers:**

- `src/ui/calendarView.ts` — `CalendarView` (extends `ItemView`) renders the full calendar: header with month/year/nav, 6×7 grid with week numbers, day cells with note/task dots, and optional notes panel. All rendering is imperative DOM manipulation (no framework).
- `src/settings.ts` — `ActivityCalendarSettingTab` and `DEFAULT_SETTINGS`. Settings are organized into general, note indicators, display notes, and per-period-type (daily/weekly/monthly/quarterly/yearly) sections.
- `src/commands/index.ts` — `registerCommands()` adds 10 commands (open today/tomorrow/yesterday, open weekly, navigate calendar, display active note).
- `src/utils/periodicNotes.ts` — `getNotePath()`, `openPeriodicNote()`, `deletePeriodicNote()`. Handles path resolution using name templates and folder settings, note creation from templates with variable substitution, and split pane opening.
- `src/utils/dateFormat.ts` — Pure date utilities: ISO/US week numbers, quarter calculation, `formatDate()` (custom token-based formatter), `parseDate()`, `isSameDay()`.
- `src/utils/variables.ts` — `substituteVariables()` replaces `{{date:FORMAT}}`, `{{today:FORMAT}}`, `{{title}}` tokens with date arithmetic support (`{{date:yyyy-MM-dd:+d7}}`).
- `src/types.ts` — All shared TypeScript interfaces and type aliases.

**Build**: esbuild bundles `src/main.ts` → `main.js` (CJS format). `obsidian` and Electron/CodeMirror packages are externalized.

**Testing**: Vitest with `src/__mocks__/obsidian.ts` providing minimal stubs. The `obsidian` import is aliased in `vitest.config.ts`. Tests live alongside source files as `*.test.ts`.

## TypeScript Configuration

Strict settings enabled: `noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess`, `useUnknownInCatchVariables`. Base URL is `src/`.

## Linting

ESLint uses `eslint-plugin-obsidianmd` recommended config (includes Obsidian-specific rules like sentence-case UI text, no sample code). Some rules are suppressed inline with `// eslint-disable-next-line obsidianmd/ui/sentence-case` where needed.

## CSS Classes

All CSS classes are prefixed with `ac-` (e.g., `ac-view`, `ac-grid`, `ac-day`, `ac-dot--note`).
