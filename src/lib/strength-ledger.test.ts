import { describe, expect, it } from "vitest";
import { buildStrengthSummary } from "@/lib/strength-analytics";
import { buildStrengthLedger } from "@/lib/strength-ledger";
import type {
  Activity,
  StrengthReconciliation,
  Workout,
} from "@/lib/types";

function workout(id: string, dateLocal: string, focus: Workout["focus"]): Workout {
  const dateKey = dateLocal.slice(0, 10);
  return {
    id,
    source: "war-room",
    dateLocal,
    dateKey,
    monthKey: dateKey.slice(0, 7),
    year: 2026,
    name: `${focus} workout`,
    focus,
    durationSeconds: 2700,
    pullUps: 100,
    pushUps: id === "second" ? 50 : null,
    pullUpMonthTotal: 100,
    pullUpMonthTarget: 2000,
    conditioning: [],
  };
}

function activity(id: string, dateLocal: string): Activity {
  const dateKey = dateLocal.slice(0, 10);
  return {
    id,
    dateLocal,
    dateKey,
    monthKey: dateKey.slice(0, 7),
    year: 2026,
    name: "Weight Training",
    activityType: "Weight Training",
    sportGroup: "Strength",
    elapsedSeconds: 2700,
    movingSeconds: 2600,
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

const workouts = [
  workout("first", "2026-01-02T05:00:00", "Quads"),
  workout("second", "2026-02-03T05:00:00", "Chest"),
];
const activities = [
  activity("confident", "2026-01-01T18:00:00"),
  activity("possible", "2026-02-02T18:00:00"),
  activity("strava-only", "2026-01-15T08:00:00"),
];
const reconciliation: StrengthReconciliation = {
  workoutCount: 2,
  stravaStrengthCount: 3,
  matches: [
    {
      workoutId: "first",
      activityId: "confident",
      strategy: "sydney-offset",
      confidence: "confident",
      startDeltaMinutes: 0,
      durationDeltaMinutes: 0,
    },
    {
      workoutId: "second",
      activityId: "possible",
      strategy: "sydney-offset",
      confidence: "possible",
      startDeltaMinutes: 1,
      durationDeltaMinutes: 40,
    },
  ],
  unmatchedWorkoutIds: [],
  unmatchedActivityIds: ["strava-only"],
};

describe("unified strength ledger", () => {
  it("uses the confirmed policy to collapse possible and confident duplicates", () => {
    const ledger = buildStrengthLedger(workouts, activities, reconciliation, true);

    expect(ledger.sessions).toHaveLength(3);
    expect(ledger.sessions.map((session) => session.source)).toEqual([
      "combined",
      "strava",
      "combined",
    ]);
    expect(ledger.diagnostics).toEqual({
      warRoomWorkouts: 2,
      stravaStrengthActivities: 3,
      confidentDuplicates: 1,
      acceptedPossibleDuplicates: 1,
      stravaOnlySessions: 1,
    });
  });

  it("retains possible matches as separate sessions when policy is not accepted", () => {
    const ledger = buildStrengthLedger(workouts, activities, reconciliation, false);

    expect(ledger.sessions).toHaveLength(4);
    expect(ledger.sessions.filter((session) => session.source === "combined")).toHaveLength(1);
    expect(ledger.sessions.filter((session) => session.source === "strava")).toHaveLength(2);
  });

  it("aggregates explainable strength totals without summing cumulative checkpoints", () => {
    const ledger = buildStrengthLedger(workouts, activities, reconciliation, true);
    const summary = buildStrengthSummary(ledger.sessions);

    expect(summary).toMatchObject({
      datasetStart: "2026-01-02",
      datasetEnd: "2026-02-03",
      sessions: 3,
      activeDays: 3,
      durationSeconds: 8100,
      pullUps: 200,
      pushUps: 50,
    });
    expect(summary.monthly).toEqual([
      {
        month: "2026-01",
        label: "Jan ’26",
        sessions: 2,
        durationSeconds: 5400,
        pullUps: 100,
        pushUps: 0,
      },
      {
        month: "2026-02",
        label: "Feb ’26",
        sessions: 1,
        durationSeconds: 2700,
        pullUps: 100,
        pushUps: 50,
      },
    ]);
    expect(summary.focusBreakdown.map((item) => [item.focus, item.sessions])).toEqual([
      ["Chest", 1],
      ["General", 1],
      ["Quads", 1],
    ]);
    expect(summary.heatmap).toHaveLength(364);
  });
});
