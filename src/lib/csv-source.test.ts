import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseActivitiesCsv, sportGroupFor } from "@/lib/csv-source";

describe("Strava CSV ingestion", () => {
  it("profiles the supplied archive without losing activities", () => {
    const dataset = parseActivitiesCsv(readFileSync("activities.csv", "utf8"));
    expect(dataset.diagnostics).toEqual({ rowCount: 2986, skippedRows: 0, duplicateIds: 0 });
    expect(dataset.activities).toHaveLength(2986);
    expect(dataset.activities[0].dateKey).toBe("2026-07-10");
    expect(dataset.activities.at(-1)?.dateKey).toBe("2020-07-23");

    const counts = Object.fromEntries(
      [...new Set(dataset.activities.map((activity) => activity.activityType))].map((type) => [
        type,
        dataset.activities.filter((activity) => activity.activityType === type).length,
      ]),
    );
    expect(counts).toMatchObject({
      Run: 1074,
      "Weight Training": 547,
      Swim: 539,
      "Virtual Ride": 428,
      Ride: 266,
    });

    const distance = dataset.activities.reduce((sum, activity) => sum + activity.distanceMeters, 0);
    const moving = dataset.activities.reduce((sum, activity) => sum + activity.movingSeconds, 0);
    const elevation = dataset.activities.reduce((sum, activity) => sum + (activity.elevationGainMeters ?? 0), 0);
    expect(distance / 1000).toBeCloseTo(45794.7, 1);
    expect(moving / 3600).toBeCloseTo(3288.4, 1);
    expect(elevation).toBeCloseTo(497314, 0);
  });

  it("uses the detailed duplicate fields and preserves blank optional metrics", () => {
    const csv = [
      "Activity ID,Activity Date,Activity Name,Activity Type,Elapsed Time,Elapsed Time,Moving Time,Distance,Distance",
      '1,"Jul 10, 2026, 9:07:03 PM",Morning Run,Run,4200,4163,3942,14.83,14829.9',
    ].join("\n");
    const activity = parseActivitiesCsv(csv).activities[0];
    expect(activity.elapsedSeconds).toBe(4163);
    expect(activity.distanceMeters).toBe(14829.9);
    expect(activity.averageHeartRate).toBeNull();
    expect(activity.dateLocal).toBe("2026-07-10T21:07:03");
  });

  it("groups related sports without losing exact Strava types", () => {
    expect(sportGroupFor("Ride")).toBe("Cycling");
    expect(sportGroupFor("Virtual Ride")).toBe("Cycling");
    expect(sportGroupFor("Weight Training")).toBe("Strength");
    expect(sportGroupFor("Kayaking")).toBe("Other");
  });
});
