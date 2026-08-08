import type {
  Activity,
  ActivityRecord,
  AnnualSummary,
  ComparisonTotals,
  DashboardFilters,
  DashboardSummary,
  DashboardTotals,
  ExplorerFilters,
  ExplorerResult,
  HeatmapDay,
  MonthlyVolume,
  SportBreakdown,
  SportGroup,
  StrengthSession,
} from "@/lib/types";
import { SPORT_GROUPS } from "@/lib/types";
import { formatDate, formatDistance, formatDuration, formatElevation } from "@/lib/format";

function utcDate(dateKey: string) {
  return new Date(`${dateKey}T00:00:00Z`);
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function shiftDays(value: string, days: number) {
  const date = utcDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return dateKey(date);
}

function daysBetween(from: string, to: string) {
  return Math.round((utcDate(to).getTime() - utcDate(from).getTime()) / 86_400_000);
}

function clampDate(value: string, minimum: string, maximum: string) {
  return value < minimum ? minimum : value > maximum ? maximum : value;
}

export interface DateWindow {
  from: string;
  to: string;
  label: string;
  comparisonFrom?: string;
  comparisonTo?: string;
}

export function resolveWindow(filters: DashboardFilters, minimum: string, maximum: string): DateWindow {
  if (filters.range === "12m") {
    const from = clampDate(shiftDays(maximum, -364), minimum, maximum);
    const span = daysBetween(from, maximum) + 1;
    return {
      from,
      to: maximum,
      label: `Trailing 12 months · to ${formatDate(maximum)}`,
      comparisonFrom: shiftDays(from, -span),
      comparisonTo: shiftDays(from, -1),
    };
  }

  if (filters.range === "ytd") {
    const year = Number(maximum.slice(0, 4));
    const from = `${year}-01-01`;
    return {
      from,
      to: maximum,
      label: `${year} year to date · to ${formatDate(maximum)}`,
      comparisonFrom: `${year - 1}-01-01`,
      comparisonTo: `${year - 1}${maximum.slice(4)}`,
    };
  }

  if (filters.range === "year" && filters.year) {
    const from = `${filters.year}-01-01`;
    const to = clampDate(`${filters.year}-12-31`, minimum, maximum);
    return {
      from: clampDate(from, minimum, maximum),
      to,
      label: `${filters.year}${from > minimum && filters.year === Number(minimum.slice(0, 4)) ? " · partial year" : to < `${filters.year}-12-31` ? " · partial year" : ""}`,
      comparisonFrom: `${filters.year - 1}-01-01`,
      comparisonTo: `${filters.year - 1}${to.slice(4)}`,
    };
  }

  if (filters.range === "custom" && filters.from && filters.to) {
    const from = clampDate(filters.from, minimum, maximum);
    const to = clampDate(filters.to, from, maximum);
    const span = daysBetween(from, to) + 1;
    return {
      from,
      to,
      label: `${formatDate(from)} – ${formatDate(to)}`,
      comparisonFrom: shiftDays(from, -span),
      comparisonTo: shiftDays(from, -1),
    };
  }

  return {
    from: minimum,
    to: maximum,
    label: `${formatDate(minimum)} – ${formatDate(maximum)}`,
  };
}

function inWindow(activity: Activity, from: string, to: string) {
  return activity.dateKey >= from && activity.dateKey <= to;
}

function totalActivities(activities: Activity[]): DashboardTotals {
  return activities.reduce<DashboardTotals>(
    (totals, activity) => ({
      activities: totals.activities + 1,
      movingSeconds: totals.movingSeconds + activity.movingSeconds,
      distanceMeters: totals.distanceMeters + activity.distanceMeters,
      elevationGainMeters: totals.elevationGainMeters + (activity.elevationGainMeters ?? 0),
    }),
    { activities: 0, movingSeconds: 0, distanceMeters: 0, elevationGainMeters: 0 },
  );
}

function comparisonTotals(current: DashboardTotals, previous: DashboardTotals): ComparisonTotals {
  const compare = (value: number, prior: number) =>
    prior === 0 ? null : ((value - prior) / prior) * 100;
  return {
    activities: compare(current.activities, previous.activities),
    movingSeconds: compare(current.movingSeconds, previous.movingSeconds),
    distanceMeters: compare(current.distanceMeters, previous.distanceMeters),
    elevationGainMeters: compare(current.elevationGainMeters, previous.elevationGainMeters),
  };
}

const MONTH_FORMAT = new Intl.DateTimeFormat("en-AU", {
  month: "short",
  year: "2-digit",
  timeZone: "UTC",
});

function monthlySeries(activities: Activity[], from: string, to: string): MonthlyVolume[] {
  const map = new Map<string, MonthlyVolume>();
  const cursor = utcDate(`${from.slice(0, 7)}-01`);
  const end = `${to.slice(0, 7)}-01`;
  while (dateKey(cursor) <= end) {
    const month = dateKey(cursor).slice(0, 7);
    map.set(month, {
      month,
      label: MONTH_FORMAT.format(cursor).replace(" ", " ’"),
      runningHours: 0,
      cyclingHours: 0,
      swimmingHours: 0,
      strengthHours: 0,
      mobilityHours: 0,
      otherHours: 0,
      distanceKm: 0,
      activityCount: 0,
    });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  type HourKey = "runningHours" | "cyclingHours" | "swimmingHours" | "strengthHours" | "mobilityHours" | "otherHours";
  const hourKey: Record<SportGroup, HourKey> = {
    Running: "runningHours",
    Cycling: "cyclingHours",
    Swimming: "swimmingHours",
    Strength: "strengthHours",
    Mobility: "mobilityHours",
    Other: "otherHours",
  };

  for (const activity of activities) {
    const point = map.get(activity.monthKey);
    if (!point) continue;
    const key = hourKey[activity.sportGroup];
    point[key] += activity.movingSeconds / 3600;
    point.distanceKm += activity.distanceMeters / 1000;
    point.activityCount += 1;
  }
  return [...map.values()];
}

function sportBreakdown(activities: Activity[]): SportBreakdown[] {
  const totalMoving = activities.reduce((sum, item) => sum + item.movingSeconds, 0);
  return SPORT_GROUPS.map((sportGroup) => {
    const items = activities.filter((activity) => activity.sportGroup === sportGroup);
    const movingSeconds = items.reduce((sum, item) => sum + item.movingSeconds, 0);
    return {
      sportGroup,
      activities: items.length,
      movingSeconds,
      distanceMeters: items.reduce((sum, item) => sum + item.distanceMeters, 0),
      percentage: totalMoving ? (movingSeconds / totalMoving) * 100 : 0,
    };
  }).filter((item) => item.activities > 0);
}

function annualSeries(activities: Activity[], selectedStart: string, selectedEnd: string): AnnualSummary[] {
  const years = [...new Set(activities.map((activity) => activity.year))].sort();
  return years.map((year) => {
    const items = activities.filter((activity) => activity.year === year);
    const totals = totalActivities(items);
    return {
      year,
      ...totals,
      isPartial:
        (year === Number(selectedStart.slice(0, 4)) && selectedStart.slice(5) !== "01-01") ||
        (year === Number(selectedEnd.slice(0, 4)) && selectedEnd.slice(5) !== "12-31"),
    };
  });
}

export function heatmapSeries(activities: Activity[], end: string): HeatmapDay[] {
  const activityByDay = new Map<string, { activities: number; movingMinutes: number }>();
  for (const activity of activities) {
    const existing = activityByDay.get(activity.dateKey) ?? { activities: 0, movingMinutes: 0 };
    existing.activities += 1;
    existing.movingMinutes += activity.movingSeconds / 60;
    activityByDay.set(activity.dateKey, existing);
  }
  return Array.from({ length: 364 }, (_, index) => {
    const date = shiftDays(end, index - 363);
    const value = activityByDay.get(date) ?? { activities: 0, movingMinutes: 0 };
    const level =
      value.movingMinutes === 0 ? 0 : value.movingMinutes <= 30 ? 1 : value.movingMinutes <= 60 ? 2 : value.movingMinutes <= 120 ? 3 : 4;
    return { date, activities: value.activities, movingMinutes: Math.round(value.movingMinutes), level };
  });
}

function maximum(activities: Activity[], score: (activity: Activity) => number) {
  return activities.reduce<Activity | null>(
    (best, activity) => (!best || score(activity) > score(best) ? activity : best),
    null,
  );
}

function activityRecords(activities: Activity[]): ActivityRecord[] {
  const records: ActivityRecord[] = [];
  const distanceGroups: Array<[SportGroup, string]> = [
    ["Running", "Longest run"],
    ["Cycling", "Longest ride"],
    ["Swimming", "Longest swim"],
  ];
  for (const [sportGroup, label] of distanceGroups) {
    const activity = maximum(
      activities.filter((item) => item.sportGroup === sportGroup),
      (item) => item.distanceMeters,
    );
    if (activity && activity.distanceMeters > 0) {
      records.push({
        label,
        value: formatDistance(activity.distanceMeters),
        detail: `${activity.name} · ${formatDate(activity.dateKey)}`,
        activity,
      });
    }
  }
  const climb = maximum(activities, (item) => item.elevationGainMeters ?? 0);
  if (climb && (climb.elevationGainMeters ?? 0) > 0) {
    records.push({
      label: "Biggest climb",
      value: formatElevation(climb.elevationGainMeters ?? 0),
      detail: `${climb.name} · ${formatDate(climb.dateKey)}`,
      activity: climb,
    });
  }
  const duration = maximum(activities, (item) => item.movingSeconds);
  if (duration) {
    records.push({
      label: "Longest session",
      value: formatDuration(duration.movingSeconds),
      detail: `${duration.name} · ${formatDate(duration.dateKey)}`,
      activity: duration,
    });
  }
  return records;
}

export function buildDashboardSummary(
  allActivities: Activity[],
  filters: DashboardFilters,
  windowBounds?: { minimum: string; maximum: string },
): DashboardSummary {
  if (!allActivities.length) throw new Error("No valid activities are available.");
  const datasetStart = allActivities.at(-1)!.dateKey;
  const datasetEnd = allActivities[0].dateKey;
  const window = resolveWindow(filters, windowBounds?.minimum ?? datasetStart, windowBounds?.maximum ?? datasetEnd);
  const selected = allActivities.filter(
    (activity) =>
      inWindow(activity, window.from, window.to) &&
      (!filters.sportGroup || activity.sportGroup === filters.sportGroup),
  );
  const totals = totalActivities(selected);

  let comparison: ComparisonTotals | null = null;
  if (window.comparisonFrom && window.comparisonTo) {
    const previous = allActivities.filter(
      (activity) =>
        inWindow(activity, window.comparisonFrom!, window.comparisonTo!) &&
        (!filters.sportGroup || activity.sportGroup === filters.sportGroup),
    );
    comparison = comparisonTotals(totals, totalActivities(previous));
  }

  return {
    filters,
    periodLabel: window.label,
    datasetStart,
    datasetEnd,
    totals,
    comparison,
    monthly: monthlySeries(selected, window.from, window.to),
    sportBreakdown: sportBreakdown(selected),
    annual: annualSeries(selected, window.from, window.to),
    heatmap: heatmapSeries(selected, window.to),
    records: activityRecords(selected),
    recent: selected.slice(0, 8),
    availableYears: [...new Set(allActivities.map((activity) => activity.year))].sort((a, b) => b - a),
  };
}

/**
 * Unions the reconciled strength ledger with any raw Strava "Weight Training"
 * activity the ledger doesn't already cover (e.g. outside the War Room
 * reconciliation window), using StrengthSession.activityId to avoid
 * double-counting sessions the ledger already represents.
 */
export function mergeStrengthSessions(
  ledgerSessions: StrengthSession[],
  activities: Activity[],
): StrengthSession[] {
  const coveredActivityIds = new Set(
    ledgerSessions
      .map((session) => session.activityId)
      .filter((id): id is string => id !== null),
  );

  const uncovered: StrengthSession[] = activities
    .filter((activity) => activity.sportGroup === "Strength" && !coveredActivityIds.has(activity.id))
    .map((activity) => ({
      id: `strava-raw:${activity.id}`,
      source: "strava",
      matchConfidence: null,
      activityId: activity.id,
      dateLocal: activity.dateLocal,
      dateKey: activity.dateKey,
      monthKey: activity.monthKey,
      year: activity.year,
      name: activity.name,
      focus: "General",
      durationSeconds: activity.elapsedSeconds,
      pullUps: null,
      pushUps: null,
      pullUpMonthTotal: null,
      pullUpMonthTarget: null,
      conditioning: [],
    }));

  return [...ledgerSessions, ...uncovered].sort((a, b) => b.dateLocal.localeCompare(a.dateLocal));
}

export function windowStrengthSessions(sessions: StrengthSession[], from: string, to: string) {
  return sessions.filter((session) => session.dateKey >= from && session.dateKey <= to);
}

export function strengthTotals(sessions: StrengthSession[]) {
  return {
    sessions: sessions.length,
    durationSeconds: sessions.reduce((sum, session) => sum + session.durationSeconds, 0),
    pullUps: sessions.reduce((sum, session) => sum + (session.pullUps ?? 0), 0),
  };
}

export function monthlyStrengthHours(sessions: StrengthSession[]) {
  const hoursByMonth = new Map<string, number>();
  for (const session of sessions) {
    hoursByMonth.set(session.monthKey, (hoursByMonth.get(session.monthKey) ?? 0) + session.durationSeconds / 3600);
  }
  return hoursByMonth;
}

export function mergedHeatmap(cardioHeatmap: HeatmapDay[], sessions: StrengthSession[], end: string): HeatmapDay[] {
  const byDay = new Map<string, { activities: number; movingMinutes: number }>();
  for (const day of cardioHeatmap) {
    byDay.set(day.date, { activities: day.activities, movingMinutes: day.movingMinutes });
  }
  for (const session of sessions) {
    const current = byDay.get(session.dateKey) ?? { activities: 0, movingMinutes: 0 };
    current.activities += 1;
    current.movingMinutes += session.durationSeconds / 60;
    byDay.set(session.dateKey, current);
  }

  return Array.from({ length: 364 }, (_, index) => {
    const date = shiftDays(end, index - 363);
    const value = byDay.get(date) ?? { activities: 0, movingMinutes: 0 };
    const level =
      value.movingMinutes === 0 ? 0 : value.movingMinutes <= 30 ? 1 : value.movingMinutes <= 60 ? 2 : value.movingMinutes <= 120 ? 3 : 4;
    return { date, activities: value.activities, movingMinutes: Math.round(value.movingMinutes), level };
  });
}

/** Appends a Strength row built from the reconciled sessions and recomputes percentages across the combined total. */
export function withStrengthBreakdown(
  cardioBreakdown: SportBreakdown[],
  sessions: StrengthSession[],
): SportBreakdown[] {
  if (!sessions.length) return cardioBreakdown;
  const totals = strengthTotals(sessions);
  const combined: SportBreakdown[] = [
    ...cardioBreakdown,
    { sportGroup: "Strength", activities: totals.sessions, movingSeconds: totals.durationSeconds, distanceMeters: 0, percentage: 0 },
  ];
  const totalMoving = combined.reduce((sum, item) => sum + item.movingSeconds, 0);
  return combined.map((item) => ({
    ...item,
    percentage: totalMoving ? (item.movingSeconds / totalMoving) * 100 : 0,
  }));
}

export function exploreActivities(
  allActivities: Activity[],
  filters: ExplorerFilters,
): ExplorerResult {
  const query = filters.q?.trim().toLocaleLowerCase();
  const filtered = allActivities.filter(
    (activity) =>
      (!query || activity.name.toLocaleLowerCase().includes(query)) &&
      (!filters.sportGroup || activity.sportGroup === filters.sportGroup) &&
      (!filters.activityType || activity.activityType === filters.activityType) &&
      (!filters.year || activity.year === filters.year),
  );

  const score = (activity: Activity) => {
    if (filters.sort === "distance") return activity.distanceMeters;
    if (filters.sort === "duration") return activity.movingSeconds;
    if (filters.sort === "elevation") return activity.elevationGainMeters ?? -1;
    return activity.dateLocal;
  };
  filtered.sort((a, b) => {
    const first = score(a);
    const second = score(b);
    const order = first < second ? -1 : first > second ? 1 : 0;
    return filters.direction === "asc" ? order : -order;
  });

  const pageCount = Math.max(1, Math.ceil(filtered.length / filters.pageSize));
  const page = Math.min(Math.max(1, filters.page), pageCount);
  const offset = (page - 1) * filters.pageSize;
  return {
    activities: filtered.slice(offset, offset + filters.pageSize),
    total: filtered.length,
    page,
    pageSize: filters.pageSize,
    pageCount,
    availableYears: [...new Set(allActivities.map((activity) => activity.year))].sort((a, b) => b - a),
    activityTypes: [...new Set(allActivities.map((activity) => activity.activityType))].sort(),
  };
}
