# PacePulse Release Notes

## v0.1.1 — 19 July 2026

Fixes confusing, silently-ignored dashboard and explorer filter controls.

### Highlights

- Dashboard "View" filter now only shows the Year field for Calendar year and the From/To fields for Custom dates, instead of always showing fields that had no effect for the selected Period.
- Explorer "Exact type" dropdown now scopes its options to the selected Sport group, updating instantly, so mismatched combinations (e.g. Sport = Running with Type = Ride) can no longer be picked and silently return zero results.
- Added a Reset control to both the dashboard and explorer filter bars.

### User Impact

- Filter changes now behave as shown: fields that don't apply to the current selection are hidden rather than present-but-ignored.
- No more silent zero-result states caused by picking an activity type that doesn't belong to the chosen sport.

### Privacy

- No changes to data handling; still local-first, CSV-only, server-side parsing.

### Validation

- `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`
- Manual browser verification of Period-dependent field visibility (All time, Calendar year, Custom dates) and Sport-scoped Exact type options on `/activities`

## v0.1.0 — 16 July 2026

PacePulse’s first public release turns a standard Strava activity export into a local-first, privacy-conscious performance dashboard.

### Highlights

- Explore all-time and period-filtered training totals across running, cycling, swimming, strength, mobility, and other activities.
- Review monthly volume, sport mix, yearly history, personal records, and a searchable activity archive.
- Read the full 52-week consistency heatmap across the available panel width.
- Hover any heatmap day to see its date, activity count, and moving minutes.
- Keep navigation visible with a sticky translucent header while scrolling.
- Read large distance totals with locale-aware grouping, such as `45,795 km`.
- Keep personal Strava exports server-only and excluded from Git.

### Validation

- 10 automated tests
- ESLint and TypeScript checks
- Next.js production build
- Production-response verification for all 364 heatmap cells and tooltips
