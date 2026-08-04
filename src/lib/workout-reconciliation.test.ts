import { describe, expect, it } from "vitest";
import type { Activity, Workout } from "@/lib/types";
import {
  formatStrengthReconciliation,
  reconcileStrengthActivities,
} from "@/lib/workout-reconciliation";

function activity(
  id: string,
  dateLocal: string,
  elapsedSeconds: number,
  sportGroup: Activity["sportGroup"] = "Strength",
): Activity {
  const dateKey = dateLocal.slice(0, 10);
  return {
    id,
    dateLocal,
    dateKey,
    monthKey: dateKey.slice(0, 7),
    year: Number(dateKey.slice(0, 4)),
    name: "Recorded session",
    activityType: sportGroup === "Strength" ? "Weight Training" : "Run",
    sportGroup,
    elapsedSeconds,
    movingSeconds: elapsedSeconds,
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

function workout(id: string, dateLocal: string, durationSeconds: number): Workout {
  const dateKey = dateLocal.slice(0, 10);
  return {
    id,
    source: "war-room",
    dateLocal,
    dateKey,
    monthKey: dateKey.slice(0, 7),
    year: Number(dateKey.slice(0, 4)),
    name: "Chest workout",
    focus: "Chest",
    durationSeconds,
    pullUps: 100,
    pushUps: null,
    pullUpMonthTotal: 200,
    pullUpMonthTarget: 2000,
    conditioning: [],
  };
}

describe("strength-source reconciliation", () => {
  it("finds direct and Sydney-offset probable duplicates one-to-one", () => {
    const result = reconcileStrengthActivities(
      [
        workout("workout-direct", "2026-01-02T05:00:00", 2700),
        workout("workout-offset", "2026-01-06T05:00:00", 2700),
        workout("workout-only", "2026-01-07T05:00:00", 2700),
      ],
      [
        activity("activity-direct", "2026-01-02T05:04:00", 2640),
        activity("activity-offset", "2026-01-05T18:03:00", 2670),
        activity("activity-only", "2026-01-04T12:00:00", 2700),
        activity("run", "2026-01-07T05:00:00", 2700, "Running"),
      ],
    );

    expect(result.matches).toEqual([
      {
        workoutId: "workout-offset",
        activityId: "activity-offset",
        strategy: "sydney-offset",
        confidence: "confident",
        startDeltaMinutes: 3,
        durationDeltaMinutes: 1,
      },
      {
        workoutId: "workout-direct",
        activityId: "activity-direct",
        strategy: "same-wall-clock",
        confidence: "confident",
        startDeltaMinutes: 4,
        durationDeltaMinutes: 1,
      },
    ]);
    expect(result.unmatchedWorkoutIds).toEqual(["workout-only"]);
    expect(result.unmatchedActivityIds).toEqual(["activity-only"]);
  });

  it("produces an aggregate report without exposing activity names", () => {
    const result = reconcileStrengthActivities(
      [workout("workout", "2026-01-06T05:00:00", 2700)],
      [activity("activity", "2026-01-05T18:03:00", 2670)],
    );

    expect(formatStrengthReconciliation(result)).toBe(
      [
        "War Room workouts: 1",
        "Strava strength activities in range: 1",
        "Confident duplicates: 1",
        "Possible duplicates requiring review: 0",
        "Probable timezone-shifted duplicates: 1",
        "War Room-only workouts: 0",
        "Strava-only strength activities: 0",
      ].join("\n"),
    );
  });

  it("keeps near matches visible for review without calling them confident", () => {
    const result = reconcileStrengthActivities(
      [workout("workout", "2026-01-03T07:45:00", 5100)],
      [activity("activity", "2026-01-02T20:44:00", 2700)],
    );

    expect(result.matches).toEqual([
      {
        workoutId: "workout",
        activityId: "activity",
        strategy: "sydney-offset",
        confidence: "possible",
        startDeltaMinutes: 1,
        durationDeltaMinutes: 40,
      },
    ]);
  });
});
