import { createHash } from "node:crypto";
import type {
  ConditioningEffort,
  ConditioningKind,
  Workout,
  WorkoutDataset,
  WorkoutFocus,
  WorkoutParseWarning,
} from "@/lib/types";

const MONTHS: Record<string, string> = {
  january: "01",
  february: "02",
  march: "03",
  april: "04",
  may: "05",
  june: "06",
  july: "07",
  august: "08",
  september: "09",
  october: "10",
  november: "11",
  december: "12",
};

const FOCUS_PATTERNS: Array<[WorkoutFocus, RegExp]> = [
  ["Hamstrings", /\bhamstrings?\b/i],
  ["Chest", /\bchest\b/i],
  ["Core", /\bcore\b/i],
  ["Quads", /\bquads?\b/i],
  ["Shoulders", /\bshoulders?\b/i],
  ["Arms", /\barms?\b/i],
  ["Deadlifts", /\bdeadlifts?\b/i],
];

const CONDITIONING_KIND: Record<string, ConditioningKind> = {
  bike: "Bike",
  "bike ride": "Bike",
  elliptical: "Elliptical",
  eliptical: "Elliptical",
  rowing: "Rowing",
  rower: "Rowing",
  treadmill: "Treadmill",
};

function field(block: string, label: string) {
  const match = block.match(new RegExp(`^- \\*\\*${label}:\\*\\*\\s+(.+)$`, "m"));
  return match?.[1]?.trim() ?? null;
}

function groupedInteger(value: string) {
  const normalized = value.replace(/[,.]/g, "");
  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function parseDate(value: string | null) {
  if (!value) return { dateKey: null, code: "missing-date" as const };
  const match = value.match(/^(\d{1,2})(?:st|nd|rd|th) day of ([A-Za-z]+) (\d{4})$/i);
  if (!match) return { dateKey: null, code: "invalid-date" as const };

  const [, dayInput, monthInput, yearInput] = match;
  const month = MONTHS[monthInput.toLowerCase()];
  if (!month) return { dateKey: null, code: "invalid-date" as const };

  const day = dayInput.padStart(2, "0");
  const dateKey = `${yearInput}-${month}-${day}`;
  const parsed = new Date(`${dateKey}T00:00:00Z`);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCFullYear() !== Number(yearInput) ||
    parsed.getUTCMonth() + 1 !== Number(month) ||
    parsed.getUTCDate() !== Number(dayInput)
  ) {
    return { dateKey: null, code: "invalid-date" as const };
  }

  return { dateKey, code: null };
}

function parseTimeRange(log: string | null) {
  if (!log) return { value: null, code: "missing-time" as const };
  const match = log.match(/\b(\d{1,2})h(\d{2})\s+to\s+(\d{1,2})h(\d{2})\b/i);
  if (!match) return { value: null, code: "missing-time" as const };

  const [, startHourInput, startMinuteInput, endHourInput, endMinuteInput] = match;
  const startHour = Number(startHourInput);
  const startMinute = Number(startMinuteInput);
  const endHour = Number(endHourInput);
  const endMinute = Number(endMinuteInput);
  if (
    startHour > 23 ||
    endHour > 23 ||
    startMinute > 59 ||
    endMinute > 59
  ) {
    return { value: null, code: "invalid-time" as const };
  }

  const startTotal = startHour * 60 + startMinute;
  let endTotal = endHour * 60 + endMinute;
  if (endTotal < startTotal) endTotal += 24 * 60;
  if (endTotal === startTotal) return { value: null, code: "invalid-time" as const };

  return {
    value: {
      startTime: `${String(startHour).padStart(2, "0")}:${startMinuteInput}`,
      durationSeconds: (endTotal - startTotal) * 60,
    },
    code: null,
  };
}

function countBeforePhrase(log: string, phrase: RegExp) {
  const match = log.match(phrase);
  return match ? groupedInteger(match[1]) : null;
}

function parseConditioning(log: string): ConditioningEffort[] {
  const efforts: ConditioningEffort[] = [];
  const pattern = /(\d+)\s*(?:min(?:ute)?s?|m)\s+(?:of\s+)?(elliptical|eliptical|treadmill|rowing|rower|bike(?:\s+ride)?)/gi;

  for (const match of log.matchAll(pattern)) {
    const tail = log.slice(match.index! + match[0].length, match.index! + match[0].length + 60);
    const distance = tail.match(/^\s*\(([\d.,]+)\s*m\)/i);
    const watts = tail.match(/(?:at|@)\s*(\d+)\s*(?:w|watts?)\b/i);
    efforts.push({
      kind: CONDITIONING_KIND[match[2].toLowerCase()],
      durationMinutes: Number(match[1]),
      distanceMeters: distance ? groupedInteger(distance[1]) : null,
      averageWatts: watts ? Number(watts[1]) : null,
    });
  }

  return efforts;
}

function workoutFocus(log: string, pullUps: number | null, conditioning: ConditioningEffort[]) {
  const match = FOCUS_PATTERNS.find(([, pattern]) => pattern.test(log));
  if (match) return match[0];
  if (conditioning.length) return "Conditioning";
  if (pullUps !== null) return "Pull-ups";
  return "General";
}

function workoutId(dateKey: string, startTime: string, log: string) {
  const suffix = createHash("sha256").update(log).digest("hex").slice(0, 8);
  return `war-room:${dateKey}:${startTime}:${suffix}`;
}

export function parseWorkoutReview(markdown: string): WorkoutDataset {
  const blocks = markdown.split(/^### Workout candidate\s*$/m).slice(1);
  const warnings: WorkoutParseWarning[] = [];
  const workouts: Workout[] = [];

  blocks.forEach((block, index) => {
    const candidate = index + 1;
    const date = parseDate(field(block, "Date context"));
    const log = field(block, "Log");
    const time = parseTimeRange(log);

    if (date.code) warnings.push({ candidate, code: date.code });
    if (time.code) warnings.push({ candidate, code: time.code });
    if (!date.dateKey || !time.value || !log) return;

    const pullUps = countBeforePhrase(log, /(\d[\d,.]*)\s*pull[- ]?ups?\b/i);
    const pushUps = countBeforePhrase(log, /(\d[\d,.]*)\s*push[- ]?ups?\b/i);
    const monthly = log.match(/\(([\d,.]+)\s*\/\s*([\d,.]+)\)/);
    const conditioning = parseConditioning(log);
    const focus = workoutFocus(log, pullUps, conditioning);
    const [year] = date.dateKey.split("-");

    workouts.push({
      id: workoutId(date.dateKey, time.value.startTime, log),
      source: "war-room",
      dateLocal: `${date.dateKey}T${time.value.startTime}:00`,
      dateKey: date.dateKey,
      monthKey: date.dateKey.slice(0, 7),
      year: Number(year),
      name: `${focus} workout`,
      focus,
      durationSeconds: time.value.durationSeconds,
      pullUps,
      pushUps,
      pullUpMonthTotal: monthly ? groupedInteger(monthly[1]) : null,
      pullUpMonthTarget: monthly ? groupedInteger(monthly[2]) : null,
      conditioning,
    });
  });

  workouts.sort((a, b) => b.dateLocal.localeCompare(a.dateLocal));
  return {
    workouts,
    diagnostics: {
      candidateCount: blocks.length,
      parsedCount: workouts.length,
      skippedCount: blocks.length - workouts.length,
      warnings,
    },
  };
}
