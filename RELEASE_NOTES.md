# PacePulse Release Notes

## v0.3.0 — 08 August 2026

Brings strength training into the Overview dashboard so one glance at `/`
shows the full shape of training — cardio and strength together — instead of
requiring a separate trip to `/strength`.

### Highlights

- Overview now merges reconciled War Room strength sessions with raw Strava
  strength activities the ledger doesn't already cover, using each session's
  linked Strava activity ID to avoid double-counting.
- Two new metric cards on `/`: **Strength sessions** and **Pull-ups**.
- The 52-week consistency heatmap and the two new metric cards always reflect
  the full training picture for the selected date range, regardless of which
  sport filter pill is active — the "whole picture" view. The monthly volume
  chart and sport-mix panel continue to respect the sport filter.
- Strava strength activities outside the War Room reconciliation window (previously silently dropped from `/strength`'s diagnostics) are now surfaced on Overview via the raw-activity fallback.

### User Impact

- No more disconnected dashboards — training transition (cardio to strength or
  back) is visible in one place.
- Merging in previously-invisible history pushes the all-time "Strength
  sessions" count higher than `/strength`'s reconciled-window count (720 vs.
  196) — expected, not a bug: it now includes ~524 raw Strava entries from
  before the War Room reconciliation period began.

### Privacy

- No changes to data handling; still local-first, CSV/War-Room-file-only,
  server-side parsing. `activities.csv` and the private War Room source remain
  untracked.

### Validation

- `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`
- Manual verification: Overview's Pull-ups card matches `/strength` exactly
  (16,345 all-time); `sport=Running` filter shows Running at 100% in the
  sport-mix panel while the heatmap still reports the full 325 active days,
  unchanged from the unfiltered view.

## v0.2.0 — 08 August 2026

Turns handwritten gym-log prose into structured, Strava-reconciled strength
training data on a new `/strength` dashboard.

### Highlights

- Private, server-only pipeline: extracts candidate workouts from a gitignored
  War Room log, parses reviewed entries into structured `Workout` facts (date,
  time range, pull-ups, push-ups, conditioning efforts, focus), each requiring
  an explicit `- [x] Reviewed` confirmation before it counts.
- Reconciles War Room workouts against Strava strength (`Weight Training`)
  activities by timestamp/duration so the same session from two sources isn't
  double-counted.
- New `/strength` route: monthly totals, focus-mix percentages, a 364-day
  heatmap, active days, pull-up totals, recent sessions, and a data-confidence
  panel showing how many War Room / Strava / combined / confirmed
  near-duplicate sessions make up the total.
- At merge time: 195 War Room workouts + 23 Strava strength records → 20
  confident matches + 2 human-confirmed near-duplicates, 196 unique sessions.

### User Impact

- Strength training now has explainable, de-duplicated numbers instead of raw,
  possibly double-counted Strava rows.
- The manual review checkbox means only confirmed log entries count — nothing
  is inferred silently.

### Privacy

- The War Room source and its extracted review file stay server-only and
  gitignored; nothing about individual workouts leaves the local pipeline.

### Validation

- `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`
- Automated regression coverage for the reviewed-checkbox gate and a
  conditioning-metadata-bleed fix (e.g. `"at 200W"` no longer misattributed
  across adjacent efforts)

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
