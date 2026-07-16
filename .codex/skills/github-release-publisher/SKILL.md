---
name: github-release-publisher
description: Publish verified PacePulse releases through GitHub with a mandatory human merge gate. Use when asked to create a release branch, commit and push completed work, open or merge a pull request into main, update RELEASE_NOTES.md, create a semantic version tag or GitHub release, or verify a published release.
---

# GitHub Release Publisher

Ship PacePulse changes through an auditable branch → pull request → `main` → tag → GitHub release workflow. Keep GitHub mutations explicit and verify every SHA boundary.

## Prepare

1. Read the repository `AGENTS.md` and inspect `git status -sb`, the current branch, remotes, recent commits, tags, `package.json`, and `RELEASE_NOTES.md`.
2. Require `gh`, an authenticated session, and an accessible `origin` repository.
3. Treat the remote default branch as authoritative. PacePulse currently uses `main`; do not create `master` as an alias.
4. Confirm that every working-tree change belongs to the release. Stop for user direction when unrelated changes are present.
5. Determine the version before writing release notes:
   - Use a user-specified semantic version when provided.
   - For the first release, use the matching `package.json` version.
   - Otherwise propose the next SemVer version from the change impact; ask when the major/minor choice is genuinely ambiguous.
   - Never reuse or move an existing release tag.

## Build the Release Branch

1. Create `agent/<short-release-slug>` from the default branch. Preserve intended uncommitted work when the user asked to release it.
2. Update `RELEASE_NOTES.md` with the newest release first. Include the version, local calendar date, concise highlights, user impact, privacy-relevant changes, and actual validation performed.
3. Keep `package.json` version aligned with the release tag when the release changes the package version.
4. Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`. Run focused browser or production-response verification for UI behavior when available.
5. Run `git diff --check`. Inspect the staged file list and staged diff before committing.
6. Confirm that `activities.csv`, `.env*`, private notes, credentials, and generated build output are not tracked.

## Publish and Merge

1. Stage only the reviewed release files.
2. Commit with a terse description of the release content; do not use a generic “release” message when a feature name is available.
3. Push the branch with upstream tracking.
4. Open a ready pull request into the default branch when the user requested merge/release. Describe what changed, why it changed, user impact, and validation.
5. Pause unconditionally after the pull request opens. Do not merge in the same uninterrupted workflow, even if the original request included “merge.”
6. Gather available reviewer insight before asking for a decision: check CI status, review state, review summaries, inline comments, unresolved threads, and mergeability. Distinguish automated feedback from human feedback and state clearly when no review has arrived yet.
7. Report the pull request URL, validation, checks, reviewer insights, and any actionable concerns. Ask the coder explicitly whether to merge now or leave the pull request open for review.
8. Treat only the coder’s answer after this report as merge authorization. If review is requested, leave the pull request open and stop. If immediate merge is chosen, recheck mergeability and unresolved blocking feedback before merging.
9. Synchronize the local default branch with the merged remote commit using a fast-forward pull.

## Tag and Release

1. Create the tag only after the release pull request is merged.
2. Tag the merged default-branch commit as `v<package-version>`.
3. Create a temporary Markdown file containing only the matching version section from `RELEASE_NOTES.md`; use it as the GitHub release body so older notes are not duplicated.
4. Publish a non-draft, non-prerelease GitHub release unless the user explicitly requests otherwise.
5. Fetch the tag locally and verify:
   - the pull request is `MERGED`;
   - local default branch equals `origin/<default>`;
   - the tag commit equals the merge commit;
   - the release is published and points at the intended tag;
   - the working tree is clean.

## Safety Rules

- Never commit `activities.csv` or expose the raw Strava export.
- Never force-push, move a published tag, rewrite the default branch, or use destructive Git commands.
- Never release from an unmerged feature branch.
- Never infer merge approval from the initial release request; require a fresh decision after the pull request and reviewer-insight report exist.
- Do not delete local or remote branches unless the user requests cleanup.
- Do not claim success until GitHub metadata and local SHAs agree.
- Report the branch, commit, pull request, merge commit, tag, release URL, validation, and any remaining local state.
