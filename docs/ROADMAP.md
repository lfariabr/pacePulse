# PacePulse Roadmap

Tracks where the project has been and where it's headed. Version numbers below
follow the repo's actual git tags (`v0.1.0`, `v0.1.1`), not the `v0.0.x` shorthand
used in conversation — there's no `v0.0.1`/`v0.0.2` in git history, so this doc
maps the intent onto real semver instead.

## Released

### v0.1.0 — 2026-07-16 (`64f16bd`)
First public release. Strava CSV export → local-first, privacy-conscious
performance dashboard: all-time/period totals, monthly volume, sport mix,
yearly history, personal records, searchable activity archive, 52-week
consistency heatmap.

### v0.1.1 — 2026-07-19 (`7cc669c`)
Filter UX fix. Dashboard "View" and Explorer "Exact type" filters no longer
show fields that silently had no effect; added a Reset control.

### v0.2.0 — 2026-08-08 (`8707037`, PR #3)
Adds a second, independent data pipeline: private War Room gym workouts
(Markdown, gitignored) reconciled against Strava strength activities into a
deduplicated `StrengthLedger`, surfaced on a new `/strength` page — monthly
rhythm, focus mix, pull-up totals, 52-week heatmap, reconciliation evidence,
recent sessions.

See [`docs/plans/0.2.0-strength-journey.md`](plans/0.2.0-strength-journey.md)
for what shipped and the review follow-ups already addressed post-merge.

### v0.3.0 — 2026-08-08 (`623e559`, PR #4)
Folds strength into the main `/` page: a de-duplicated merge of the strength
ledger with any raw Strava strength activity it doesn't cover, date-range
filters that now apply to strength data too, two new metric cards (Strength
sessions, Pull-ups), strength hours in the monthly rhythm chart and sport-mix
breakdown, and one merged 52-week consistency heatmap.

See [`docs/plans/0.3.0-overview-integration.md`](plans/0.3.0-overview-integration.md)
for the plan and what changed from it while building (a dataset-bounds bug
caught before shipping, and the sportGroup-filter question resolved).

## Next

Overview page polish (unreleased, in progress): drop the Elevation metric
card, link personal records through to a new per-activity detail page
(`/activities/[id]`), fix "recent activities" silently excluding strength
sessions, and add a favicon. See working branch for details once it lands.

The transition trend chart considered as a v0.3.0 fast-follow (stacked
monthly cardio-vs-strength bars) was evaluated and dropped — the monthly
volume chart already stacks a strength series, so a second chart didn't
add enough over what's already visible.

## Future / unscheduled

### War Room auto-sync runner
A scheduled job (daily or weekly) that re-runs the War Room extractor against
the source journal, greps for workout entries newer than the last sync, and
appends them to `workout-review.md` for review — so the strength ledger stays
current without a manual re-export each time. Not yet designed in detail or
assigned a version; captured here so it isn't lost.

See [`docs/plans/future-warroom-auto-sync.md`](plans/future-warroom-auto-sync.md).

### Dark / light mode
Currently a single hardcoded dark theme with no light-mode infrastructure.
Captured for later; not started.

See [`docs/plans/future-light-mode.md`](plans/future-light-mode.md).
