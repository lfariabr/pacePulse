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

## Merged, not yet tagged

### Strength journey (`8707037`, 2026-08-08, PR #3)
Adds a second, independent data pipeline: private War Room gym workouts
(Markdown, gitignored) reconciled against Strava strength activities into a
deduplicated `StrengthLedger`, surfaced on a new `/strength` page — monthly
rhythm, focus mix, pull-up totals, 52-week heatmap, reconciliation evidence,
recent sessions. Not yet cut as a release; recommend tagging as **v0.2.0**
once the version bump + release notes are written (see `package.json`, still
at `0.1.1`).

See [`docs/plans/0.2.0-strength-journey.md`](plans/0.2.0-strength-journey.md)
for what shipped and the review follow-ups already addressed post-merge.

## Next

### v0.3.0 — Overview/strength integration (planned, not started)
Today `/` (cardio) and `/strength` are two silos with no shared view. This
release folds strength into the main Overview page so training mix is visible
in one glance instead of two tabs.

See [`docs/plans/0.3.0-overview-integration.md`](plans/0.3.0-overview-integration.md)
for the full plan.

## Future / unscheduled

### War Room auto-sync runner
A scheduled job (daily or weekly) that re-runs the War Room extractor against
the source journal, greps for workout entries newer than the last sync, and
appends them to `workout-review.md` for review — so the strength ledger stays
current without a manual re-export each time. Not yet designed in detail or
assigned a version; captured here so it isn't lost.

See [`docs/plans/future-warroom-auto-sync.md`](plans/future-warroom-auto-sync.md).
