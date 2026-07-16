# PacePulse Release Notes

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
