import type {
  HeatmapDay,
  MonthlyStrength,
  StrengthFocusBreakdown,
  StrengthSession,
  StrengthSummary,
  WorkoutFocus,
} from "@/lib/types";

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

const MONTH_FORMAT = new Intl.DateTimeFormat("en-AU", {
  month: "short",
  year: "2-digit",
  timeZone: "UTC",
});

function monthlyStrength(
  sessions: StrengthSession[],
  from: string,
  to: string,
): MonthlyStrength[] {
  const months = new Map<string, MonthlyStrength>();
  const cursor = utcDate(`${from.slice(0, 7)}-01`);
  const end = `${to.slice(0, 7)}-01`;
  while (dateKey(cursor) <= end) {
    const month = dateKey(cursor).slice(0, 7);
    months.set(month, {
      month,
      label: MONTH_FORMAT.format(cursor).replace(" ", " ’"),
      sessions: 0,
      durationSeconds: 0,
      pullUps: 0,
      pushUps: 0,
    });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  for (const session of sessions) {
    const month = months.get(session.monthKey);
    if (!month) continue;
    month.sessions += 1;
    month.durationSeconds += session.durationSeconds;
    month.pullUps += session.pullUps ?? 0;
    month.pushUps += session.pushUps ?? 0;
  }
  return [...months.values()];
}

function focusBreakdown(sessions: StrengthSession[]): StrengthFocusBreakdown[] {
  const totals = new Map<WorkoutFocus, { sessions: number; durationSeconds: number }>();
  for (const session of sessions) {
    const current = totals.get(session.focus) ?? { sessions: 0, durationSeconds: 0 };
    current.sessions += 1;
    current.durationSeconds += session.durationSeconds;
    totals.set(session.focus, current);
  }

  return [...totals.entries()]
    .map(([focus, total]) => ({
      focus,
      ...total,
      percentage: sessions.length ? (total.sessions / sessions.length) * 100 : 0,
    }))
    .sort((a, b) => b.sessions - a.sessions || a.focus.localeCompare(b.focus));
}

function strengthHeatmap(sessions: StrengthSession[], end: string): HeatmapDay[] {
  const byDay = new Map<string, { activities: number; movingMinutes: number }>();
  for (const session of sessions) {
    const current = byDay.get(session.dateKey) ?? { activities: 0, movingMinutes: 0 };
    current.activities += 1;
    current.movingMinutes += session.durationSeconds / 60;
    byDay.set(session.dateKey, current);
  }

  return Array.from({ length: 364 }, (_, index) => {
    const date = shiftDays(end, index - 363);
    const total = byDay.get(date) ?? { activities: 0, movingMinutes: 0 };
    const level =
      total.movingMinutes === 0
        ? 0
        : total.movingMinutes <= 30
          ? 1
          : total.movingMinutes <= 60
            ? 2
            : total.movingMinutes <= 90
              ? 3
              : 4;
    return {
      date,
      activities: total.activities,
      movingMinutes: Math.round(total.movingMinutes),
      level,
    };
  });
}

export function buildStrengthSummary(sessions: StrengthSession[]): StrengthSummary {
  if (!sessions.length) throw new Error("No valid strength sessions are available.");
  const datasetStart = sessions.at(-1)!.dateKey;
  const datasetEnd = sessions[0].dateKey;
  return {
    datasetStart,
    datasetEnd,
    sessions: sessions.length,
    activeDays: new Set(sessions.map((session) => session.dateKey)).size,
    durationSeconds: sessions.reduce((sum, session) => sum + session.durationSeconds, 0),
    pullUps: sessions.reduce((sum, session) => sum + (session.pullUps ?? 0), 0),
    pushUps: sessions.reduce((sum, session) => sum + (session.pushUps ?? 0), 0),
    monthly: monthlyStrength(sessions, datasetStart, datasetEnd),
    focusBreakdown: focusBreakdown(sessions),
    heatmap: strengthHeatmap(sessions, datasetEnd),
    recent: sessions.slice(0, 12),
  };
}
