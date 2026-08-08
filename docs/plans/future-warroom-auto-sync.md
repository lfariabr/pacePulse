# Future — War Room auto-sync runner

Status: idea captured, not designed in detail, not assigned a version.

## Problem

Right now, keeping the strength ledger current is a manual loop:

1. Run `scripts/workout-extractor.sh` by hand against the private War Room
   source.
2. Manually tick `- [ ] Reviewed` for each new candidate in the generated
   (gitignored) `workout-review.md`.
3. Reload `/strength` (and, after v0.3.0, `/`) to see the new sessions.

Every new gym session written into the War Room journal sits invisible to the
dashboard until that loop is run again.

## Proposed shape

A scheduled runner (daily or weekly cadence — weekly is probably enough given
training frequency, but worth deciding against actual logging habits) that:

- Re-runs the extractor logic against the War Room source.
- Diffs against the previously extracted set — likely by tracking the last
  processed source line/date, or by diffing candidate hashes
  (`workoutId` already hashes the log text — see `workout-parser.ts`) — to
  find only genuinely *new* entries instead of regenerating and clobbering
  review state on every run.
- Appends new candidates to `workout-review.md` with `- [ ] Reviewed`
  unticked, preserving existing reviewed entries untouched.
- Surfaces a summary of what's new (count, date range) so review stays a
  quick "skim and tick" pass instead of a search-the-whole-file exercise.

## Open questions to resolve before designing this properly

- **Where does it run?** A local cron/launchd job (simplest, keeps the
  private source local-only, matches this project's local-first posture) vs.
  some hosted scheduled job — hosted would require the private War Room
  source to leave the local machine, which conflicts with the project's
  existing privacy stance (raw journal text, source paths, and generated
  `workout-review.md` are all deliberately gitignored today). **Local
  cron/launchd is the strong default given that constraint.**
- **Re-review safety.** The extractor currently regenerates the whole review
  file from scratch each run (per `scripts/workout-extractor.sh`); an
  auto-sync runner must not silently un-tick or duplicate already-reviewed
  entries. Needs either idempotent regeneration (skip candidates whose hash
  already exists with `[x]`) or an append-only mode.
- **Notification.** Does "keep it self-updating" mean silent (just runs, data
  is there next time the dashboard loads) or should it ping somehow (desktop
  notification, a log file, a small "N new unreviewed workouts" badge on
  `/strength`)? A badge on the dashboard itself is probably the simplest and
  most in-keeping-with-the-app answer.

## Suggested next step

Not ready to plan in detail yet — needs the idempotent-regeneration question
answered first, since that's a correctness property (must not lose review
state), not a scheduling detail. Revisit after v0.3.0 ships, once the merged
Overview view makes "how stale is my data" more visible day to day.
