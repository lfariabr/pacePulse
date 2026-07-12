import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { buildDashboardSummary, exploreActivities } from "@/lib/analytics";
import { parseActivitiesCsv } from "@/lib/csv-source";
import type { Activity } from "@/lib/types";

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
