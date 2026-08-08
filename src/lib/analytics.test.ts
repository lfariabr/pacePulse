import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import {
  buildDashboardSummary,
  exploreActivities,
  mergedHeatmap,
  mergeStrengthSessions,
  monthlyStrengthHours,
  strengthTotals,
  windowStrengthSessions,
  withStrengthBreakdown,
} from "@/lib/analytics";
import { parseActivitiesCsv } from "@/lib/csv-source";
import type { Activity, HeatmapDay, SportBreakdown, StrengthSession } from "@/lib/types";

let activities: Activity[];

beforeAll(() => {
  activities = parseActivitiesCsv(readFileSync("activities.csv", "utf8")).activities;
});

describe("dashboard analytics", () => {
  it("builds explainable all-time totals and records", () => {
    const summary = buildDashboardSummary(activities, { range: "all" });
    expect(summary.totals.activities).toBe(2986);
    expect(summary.comparison).toBeNull();
    expect(summary.availableYears).toEqual([2026, 2025, 2024, 2023, 2022, 2021, 2020]);
    expect(summary.records.find((record) => record.label === "Longest run")?.activity.id).toBeTruthy();
    expect(summary.records.find((record) => record.label === "Longest run")?.activity.distanceMeters).toBeCloseTo(83845.9, 0);
    expect(summary.heatmap).toHaveLength(364);
  });

  it("keeps zero-distance strength activities while omitting distance", () => {
    const summary = buildDashboardSummary(activities, { range: "all", sportGroup: "Strength" });
    expect(summary.totals.activities).toBe(547);
    expect(summary.totals.distanceMeters).toBe(0);
    expect(summary.sportBreakdown).toHaveLength(1);
  });

  it("compares bounded periods against an equivalent prior period", () => {
    const summary = buildDashboardSummary(activities, { range: "ytd" });
    expect(summary.periodLabel).toContain("2026 year to date");
    expect(summary.comparison).not.toBeNull();
  });
});

describe("activity explorer", () => {
  it("filters, sorts, and paginates on the server", () => {
    const result = exploreActivities(activities, {
      q: "ultraman",
      sportGroup: "Running",
      sort: "distance",
      direction: "desc",
      page: 1,
      pageSize: 50,
    });
    expect(result.total).toBeGreaterThan(0);
    expect(result.activities.every((activity) => activity.sportGroup === "Running")).toBe(true);
    expect(result.activities[0].distanceMeters).toBeGreaterThanOrEqual(result.activities.at(-1)!.distanceMeters);
  });
});

function strengthActivity(id: string, dateLocal: string, sportGroup: Activity["sportGroup"] = "Strength"): Activity {
  const dateKey = dateLocal.slice(0, 10);
  return {
    id,
    dateLocal,
    dateKey,
    monthKey: dateKey.slice(0, 7),
    year: Number(dateKey.slice(0, 4)),
    name: "Weight Training",
    activityType: "Weight Training",
    sportGroup,
    elapsedSeconds: 1800,
    movingSeconds: 1800,
    distanceMeters: 0,
    elevationGainMeters: null,
    averageSpeedMps: null,
    maxSpeedMps: null,
    averageHeartRate: null,
    maxHeartRate: null,
    relativeEffort: null,
    calories: null,
    averageWatts: null,
    weightedAverageWatts: null,
    averageCadence: null,
    averageTemperature: null,
    totalSteps: null,
    gear: null,
    commute: false,
  };
}

function strengthSession(
  id: string,
  dateLocal: string,
  overrides: Partial<StrengthSession> = {},
): StrengthSession {
  const dateKey = dateLocal.slice(0, 10);
  return {
    id,
    source: "war-room",
    matchConfidence: null,
    activityId: null,
    dateLocal,
    dateKey,
    monthKey: dateKey.slice(0, 7),
    year: Number(dateKey.slice(0, 4)),
    name: "Quads workout",
    focus: "Quads",
    durationSeconds: 2700,
    pullUps: 10,
    pushUps: null,
    pullUpMonthTotal: null,
    pullUpMonthTarget: null,
    conditioning: [],
    ...overrides,
  };
}

describe("mergeStrengthSessions", () => {
  it("keeps ledger sessions and folds in raw Strava strength activities the ledger doesn't cover", () => {
    const ledgerSessions = [strengthSession("war-room:1", "2026-02-01T06:00:00", { activityId: "covered" })];
    const rawActivities = [
      strengthActivity("covered", "2026-02-01T06:00:00"),
      strengthActivity("uncovered", "2025-01-01T06:00:00"),
      strengthActivity("cardio", "2026-02-02T06:00:00", "Running"),
    ];

    const merged = mergeStrengthSessions(ledgerSessions, rawActivities);

    expect(merged).toHaveLength(2);
    expect(merged.map((item) => item.id)).toEqual(["war-room:1", "strava-raw:uncovered"]);
    expect(merged.find((item) => item.id === "strava-raw:uncovered")).toMatchObject({
      source: "strava",
      activityId: "uncovered",
      durationSeconds: 1800,
      pullUps: null,
    });
  });
});

describe("windowStrengthSessions", () => {
  it("filters sessions to the inclusive date window", () => {
    const sessions = [
      strengthSession("a", "2026-01-01T06:00:00"),
      strengthSession("b", "2026-02-01T06:00:00"),
      strengthSession("c", "2026-03-01T06:00:00"),
    ];

    expect(windowStrengthSessions(sessions, "2026-01-15", "2026-02-15").map((item) => item.id)).toEqual(["b"]);
  });
});

describe("strengthTotals", () => {
  it("sums sessions, duration, and pull-ups", () => {
    const sessions = [
      strengthSession("a", "2026-01-01T06:00:00", { pullUps: 10 }),
      strengthSession("b", "2026-01-02T06:00:00", { pullUps: null, durationSeconds: 1200 }),
    ];

    expect(strengthTotals(sessions)).toEqual({ sessions: 2, durationSeconds: 3900, pullUps: 10 });
  });
});

describe("monthlyStrengthHours", () => {
  it("groups duration by monthKey", () => {
    const sessions = [
      strengthSession("a", "2026-01-01T06:00:00", { durationSeconds: 3600 }),
      strengthSession("b", "2026-01-15T06:00:00", { durationSeconds: 1800 }),
      strengthSession("c", "2026-02-01T06:00:00", { durationSeconds: 3600 }),
    ];

    const hours = monthlyStrengthHours(sessions);
    expect(hours.get("2026-01")).toBe(1.5);
    expect(hours.get("2026-02")).toBe(1);
  });
});

describe("mergedHeatmap", () => {
  it("adds strength minutes onto the cardio heatmap for the same date", () => {
    const end = "2026-02-01";
    const cardio: HeatmapDay[] = Array.from({ length: 364 }, (_, index) => ({
      date: index === 363 ? end : "2020-01-01",
      activities: index === 363 ? 1 : 0,
      movingMinutes: index === 363 ? 30 : 0,
      level: index === 363 ? 1 : 0,
    }));
    const sessions = [strengthSession("a", `${end}T06:00:00`, { durationSeconds: 3600 })];

    const merged = mergedHeatmap(cardio, sessions, end);
    const last = merged.at(-1)!;

    expect(last.date).toBe(end);
    expect(last.activities).toBe(2);
    expect(last.movingMinutes).toBe(90);
    expect(last.level).toBe(3);
  });
});

describe("withStrengthBreakdown", () => {
  it("appends a Strength row and recomputes percentages across the combined total", () => {
    const cardioBreakdown: SportBreakdown[] = [
      { sportGroup: "Running", activities: 1, movingSeconds: 3600, distanceMeters: 10000, percentage: 100 },
    ];
    const sessions = [strengthSession("a", "2026-01-01T06:00:00", { durationSeconds: 3600 })];

    const result = withStrengthBreakdown(cardioBreakdown, sessions);

    expect(result).toHaveLength(2);
    expect(result[0].percentage).toBe(50);
    expect(result[1]).toMatchObject({ sportGroup: "Strength", activities: 1, movingSeconds: 3600, percentage: 50 });
  });

  it("returns the cardio breakdown unchanged when there are no strength sessions", () => {
    const cardioBreakdown: SportBreakdown[] = [
      { sportGroup: "Running", activities: 1, movingSeconds: 3600, distanceMeters: 10000, percentage: 100 },
    ];

    expect(withStrengthBreakdown(cardioBreakdown, [])).toBe(cardioBreakdown);
  });
});
