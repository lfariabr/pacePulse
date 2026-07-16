# PacePulse Engineering Guide

These instructions apply to the entire repository.

## Product Direction

PacePulse is a personal, local-first performance archive built from user-owned Strava data. Make six years of training legible through factual totals, trends, consistency, sport mix, records, and activity exploration. Prefer explainable metrics over proprietary readiness, fitness, or motivation scores.

The product should feel like a serious performance instrument: dark charcoal surfaces, warm orange emphasis, bold numeric typography, restrained sport colours, dense but calm information design, and excellent mobile behavior. Polish should serve comprehension rather than decoration.

## Privacy and Data Boundaries

- Never commit `activities.csv`, `.env*`, credentials, GPX files, or personal exports.
- Keep CSV reading and normalization server-only. Do not import `csv-source.ts` into Client Components.
- Do not serialize activity descriptions, private notes, filenames, or media references to the browser.
- Treat blank source metrics as `null`, not zero. A recorded zero and a missing value are different states.
- Preserve Strava activity timestamps as timezone-less local wall-clock values unless the data source later provides an explicit timezone.
- Keep the `ActivitySource` boundary so live Strava OAuth/sync can replace CSV ingestion without rewriting dashboard components.

## Architecture

- Use Next.js App Router, strict TypeScript, Tailwind/CSS, and Server Components by default.
- Keep parsing and normalization in `src/lib/csv-source.ts`, pure aggregation in `src/lib/analytics.ts`, shared contracts in `src/lib/types.ts`, and display formatting in `src/lib/format.ts`.
- Keep Client Components limited to genuine interaction such as charts and dialogs. Pass them only the smallest serializable dataset they need.
- Validate URL-backed filters with Zod and preserve explorer state in query parameters.
- Disambiguate duplicated Strava headers by occurrence. Prefer the detailed distance, elapsed-time, and moving-time fields already encoded by the parser.
- Preserve exact Strava types while grouping overview analytics as Running, Cycling, Swimming, Strength, Mobility, and Other.
- Use sport-aware output: min/km for running, min/100 m for swimming, km/h for cycling, and duration/count metrics for zero-distance work.
- Label partial years and compare only equivalent bounded periods. Do not invent an all-time comparison.

## Interface Expectations

- Maintain accessible contrast, keyboard behavior, visible focus, semantic controls, and responsive layouts.
- Keep the primary header sticky so navigation remains available during long dashboard scrolls.
- Make the 52-week consistency heatmap use the full panel width. Every cell must expose date, activity count, and moving minutes on hover.
- Format user-facing numbers with `en-AU` grouping and units. Centralize formatting rather than formatting ad hoc in components.
- Omit unavailable detail metrics instead of displaying misleading zeroes.
- Do not add maps until actual GPX/route data is available.

## Quality Bar

- Add or update focused tests for parser, analytics, filtering, records, and formatting behavior.
- Preserve the supplied archive invariants: 2,986 unique activities from 23 July 2020 through 10 July 2026 unless the fixture intentionally changes.
- Before handoff, run:

```bash
npm test
npm run lint
npm run typecheck
npm run build
git diff --check
```

- For visible changes, verify the rendered dashboard at desktop and mobile widths when an in-app browser is available. Otherwise verify the production response and clearly disclose the visual-testing limitation.
- Do not commit generated `.next` output or unrelated user changes.

## GitHub and Releases

- The default branch is `main`.
- Use `agent/<short-description>` for implementation and release branches.
- Keep commits focused and messages terse. Push only after reviewing the staged diff.
- Update `RELEASE_NOTES.md` for releases and keep the newest version first.
- Use the repository skill at `.codex/skills/github-release-publisher/SKILL.md` when asked to branch, commit, merge, tag, or publish a GitHub release.
- After opening a pull request, always pause before merging. Gather available checks, reviews, comments, and unresolved-thread insights, then report them to the coder.
- Ask the coder whether to merge immediately or leave the pull request open for review. The original request to “merge” is not sufficient post-PR authorization.
- Create tags and GitHub releases only after the coder confirms the merge and the pull request is merged into `main`.
- Never force-push, rewrite published history, or move an existing release tag.
