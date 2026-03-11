# Obsidian Activity Calendar

A sidebar calendar plugin for [Obsidian](https://obsidian.md) that lets you create and navigate periodic notes — daily, weekly, monthly, quarterly, and yearly.

## Features

- 6-week calendar grid with configurable first day of week
- Note indicators and task status dots on calendar days
- Notes panel showing notes by creation date or period type
- ISO and US week number display
- Template variable substitution with date arithmetic (`{{date:yyyy-MM-dd:+d7}}`)
- Context menu for opening notes in split panes

## Installation

### From Community Plugins

Search for "Activity Calendar" in Obsidian's community plugin browser.

### Manual

Copy `main.js`, `styles.css`, and `manifest.json` to your vault at `.obsidian/plugins/activity-calendar/`.

## Development

```bash
pnpm install         # Install dependencies
pnpm run dev         # Start esbuild watch mode
pnpm run build       # Type-check and bundle for production
pnpm run lint        # Run ESLint
pnpm test            # Run tests
pnpm run test:watch  # Run tests in watch mode
```

## Support

If you find this plugin useful, you can support its development:

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/jeffects)
