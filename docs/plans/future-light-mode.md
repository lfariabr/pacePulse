# Future — Dark / light mode

Status: not started, not scheduled. Captured so the scope isn't lost.

## Current state

PacePulse ships a single, hardcoded dark theme:

- Tailwind v4, CSS-based config (no `tailwind.config.*` file — `postcss.config.mjs`
  wires in `@tailwindcss/postcss` directly).
- One `:root` token set in `src/app/globals.css` (`--background`, `--surface`,
  `--text`, `--orange`, `--green`, `--red`, etc.) — no light-mode alternative.
- `html { color-scheme: dark; ... }` is hardcoded (`globals.css`).
- No `@media (prefers-color-scheme: light)` block, no `data-theme` attribute,
  no toggle mechanism, and no `dark:` Tailwind utility classes used anywhere
  in `src/`.

## Why it isn't a small change

The real work isn't adding a light palette — it's that a chunk of color
usage in `globals.css` already bypasses the token system entirely:

- The `.sport-*` classes (`.sport-running`, `.sport-strength`, etc.) use
  hardcoded hex colors with `!important`, independent of any `--token`.
- Several component classes use literal hex values assuming a dark
  background (e.g. `.record` uses `background: #0b121a` directly, not a
  `var(--surface)`-style token).

A real light-mode pass means auditing every hardcoded color in
`globals.css`, moving them onto tokens, then defining a second palette and
deciding how it's selected.

## Open question for Luis

System-preference-only (`prefers-color-scheme`, no manual override), or a
manual toggle too (requires a `data-theme` attribute + a small client
component + persisting the choice, e.g. `localStorage`)? This decides how
much of the "toggle mechanism" work is in scope alongside the color audit.

## Not built yet

Nothing — this file exists purely to hold the scope until it's picked up.
