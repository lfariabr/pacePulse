#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: ./scripts/workout-extractor.sh <war-room-root> [output-file]

Extracts completed gym-workout entries and their indented details from War Room
Markdown files into a single review document.

Arguments:
  war-room-root  Directory containing the War Room Markdown files. If a
                 sibling named <directory>_WarRoom.md exists, it is included.
  output-file    Destination Markdown file (default: ./workout-review.md).

The generated review file contains personal training data and should not be
committed. The default output is ignored by this repository.
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ $# -lt 1 || $# -gt 2 ]]; then
  usage >&2
  exit 2
fi

source_root=${1%/}
output_file=${2:-"$(pwd)/workout-review.md"}

if [[ ! -d "$source_root" ]]; then
  echo "War Room directory not found: $source_root" >&2
  exit 1
fi

mkdir -p "$(dirname "$output_file")"

body_file=$(mktemp)
file_list=$(mktemp)
trap 'rm -f "$body_file" "$file_list"' EXIT

{
  find "$source_root" -type f -name '*.md' -print
  if [[ -f "${source_root}_WarRoom.md" ]]; then
    printf '%s\n' "${source_root}_WarRoom.md"
  fi
} | LC_ALL=C sort -u > "$file_list"

while IFS= read -r source_file; do
  if [[ "$source_file" == "$source_root"/* ]]; then
    relative_path=${source_file#"$source_root"/}
  else
    relative_path=$(basename "$source_file")
  fi

  awk -v source="$relative_path" '
    function is_completed_task(value) {
      return value ~ /^- \[[xX]\][[:space:]]/
    }

    function is_gym_workout(value, lower) {
      lower = tolower(value)
      if (index(lower, "gym") > 0 && index(lower, "workout") > 0) return 1
      if (lower ~ /workout[[:space:]]+(hamstrings?|chest|core|quads?|shoulders?|arms?|deadlifts?)/) return 1
      return 0
    }

    function print_context() {
      print "### Workout candidate"
      print ""
      print "- [ ] Reviewed"
      print "- **Source:** `" source "`"
      if (month != "") print "- **Month section:** " month
      if (week != "") print "- **Week:** " week
      if (day != "") print "- **Day:** " day
      if (date_context != "") print "- **Date context:** " date_context
      print "- **Log:** " workout_line
      print ""
    }

    /^## [^#]/ {
      month = substr($0, 4)
      week = ""
      day = ""
      date_context = ""
      next
    }

    /^### Week/ {
      week = substr($0, 5)
      next
    }

    /^#### Day/ {
      day = substr($0, 6)
      date_context = ""
      next
    }

    /It is the [0-9][0-9]*(st|nd|rd|th) day of [A-Za-z]+ [0-9][0-9][0-9][0-9]/ {
      date_context = $0
      sub(/^.*It is the /, "", date_context)
      sub(/ and I.*$/, "", date_context)
      sub(/[.]$/, "", date_context)
    }

    is_completed_task($0) {
      if (capturing) {
        print ""
        print "---"
        print ""
      }
      capturing = 0

      if (is_gym_workout($0)) {
        workout_line = $0
        print_context()
        capturing = 1
      }
      next
    }

    capturing && /^    / {
      print $0
      next
    }

    capturing && ($0 ~ /^#/ || $0 ~ /^---$/) {
      print ""
      print "---"
      print ""
      capturing = 0
    }

    END {
      if (capturing) {
        print ""
        print "---"
        print ""
      }
    }
  ' "$source_file" >> "$body_file"
done < "$file_list"

candidate_count=$(grep -c '^### Workout candidate$' "$body_file" || true)
generated_at=$(date '+%Y-%m-%d %H:%M:%S %Z')

{
  printf '# Workout Review\n\n'
  printf '> Generated locally on %s from `%s`.\n' "$generated_at" "$source_root"
  printf '> This file contains personal training data. Review it locally and do not commit it.\n\n'
  printf '**Candidates:** %s completed gym workouts\n\n' "$candidate_count"
  printf 'Tick **Reviewed** after confirming each entry. Edit this generated copy freely; rerunning the extractor replaces it.\n\n'
  printf '%s\n' '---'
  printf '\n'
  cat "$body_file"
} > "$output_file"

printf 'Extracted %s workout candidates to %s\n' "$candidate_count" "$output_file"
