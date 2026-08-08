import type { Activity, HeatmapDay, SportBreakdown, StrengthSession } from "@/lib/types";

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
