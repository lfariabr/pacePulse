import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";
import type {
  Activity,
  ActivityDataset,
  ActivitySource,
  SportGroup,
} from "@/lib/types";

const MONTHS: Record<string, string> = {
  Jan: "01",
  Feb: "02",
  Mar: "03",
  Apr: "04",
  May: "05",
  Jun: "06",
  Jul: "07",
  Aug: "08",
  Sep: "09",
  Oct: "10",
  Nov: "11",
  Dec: "12",
};

function disambiguateHeaders(headers: string[]) {
  const occurrences = new Map<string, number>();
  return headers.map((header) => {
    const occurrence = (occurrences.get(header) ?? 0) + 1;
    occurrences.set(header, occurrence);
    return occurrence === 1 ? header : `${header}__${occurrence}`;
  });
}

function requiredIndex(headers: string[], name: string) {
  const index = headers.indexOf(name);
  if (index === -1) {
    throw new Error(`The Strava export is missing the required “${name}” column.`);
  }
  return index;
}

function optionalIndex(headers: string[], name: string) {
  const index = headers.indexOf(name);
  return index === -1 ? null : index;
}

function numberValue(row: string[], index: number | null): number | null {
  if (index === null || row[index] === undefined || row[index].trim() === "") {
    return null;
  }
  const value = Number(row[index]);
  return Number.isFinite(value) ? value : null;
}

function stringValue(row: string[], index: number | null) {
  if (index === null) return null;
  const value = row[index]?.trim();
  return value ? value : null;
}

function parseStravaDate(value: string) {
  const match = value.match(
    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{1,2}), (\d{4}), (\d{1,2}):(\d{2}):(\d{2}) (AM|PM)$/,
  );
  if (!match) throw new Error(`Unsupported Strava activity date: ${value}`);

  const [, monthName, day, year, hourInput, minute, second, meridiem] = match;
  let hour = Number(hourInput) % 12;
  if (meridiem === "PM") hour += 12;
  const dateKey = `${year}-${MONTHS[monthName]}-${day.padStart(2, "0")}`;
  return {
    dateKey,
    dateLocal: `${dateKey}T${String(hour).padStart(2, "0")}:${minute}:${second}`,
    monthKey: dateKey.slice(0, 7),
    year: Number(year),
  };
}

export function sportGroupFor(activityType: string): SportGroup {
  if (activityType === "Run") return "Running";
  if (activityType === "Ride" || activityType === "Virtual Ride") return "Cycling";
  if (activityType === "Swim") return "Swimming";
  if (activityType === "Weight Training") return "Strength";
  if (activityType === "Yoga") return "Mobility";
  return "Other";
}

export function parseActivitiesCsv(csv: string): ActivityDataset {
  const records = parse(csv, {
    bom: true,
    relax_column_count: true,
    skip_empty_lines: true,
  }) as string[][];

  if (records.length < 2) throw new Error("The Strava export contains no activities.");

  const headers = disambiguateHeaders(records[0]);
  const index = {
    id: requiredIndex(headers, "Activity ID"),
    date: requiredIndex(headers, "Activity Date"),
    name: requiredIndex(headers, "Activity Name"),
    type: requiredIndex(headers, "Activity Type"),
    elapsed: requiredIndex(headers, "Elapsed Time__2"),
    moving: requiredIndex(headers, "Moving Time"),
    distance: requiredIndex(headers, "Distance__2"),
    elevation: optionalIndex(headers, "Elevation Gain"),
    averageSpeed: optionalIndex(headers, "Average Speed"),
    maxSpeed: optionalIndex(headers, "Max Speed"),
    averageHeartRate: optionalIndex(headers, "Average Heart Rate"),
    maxHeartRate: optionalIndex(headers, "Max Heart Rate"),
    relativeEffort: optionalIndex(headers, "Relative Effort__2"),
    calories: optionalIndex(headers, "Calories"),
    averageWatts: optionalIndex(headers, "Average Watts"),
    weightedAverageWatts: optionalIndex(headers, "Weighted Average Power"),
    averageCadence: optionalIndex(headers, "Average Cadence"),
    averageTemperature: optionalIndex(headers, "Average Temperature"),
    totalSteps: optionalIndex(headers, "Total Steps"),
    gear: optionalIndex(headers, "Activity Gear"),
    commute: optionalIndex(headers, "Commute"),
  };

  const activities = new Map<string, Activity>();
  let skippedRows = 0;
  let duplicateIds = 0;

  for (const row of records.slice(1)) {
    try {
      const id = row[index.id]?.trim();
      const name = row[index.name]?.trim();
      const activityType = row[index.type]?.trim();
      if (!id || !name || !activityType) throw new Error("Missing required value");
      if (activities.has(id)) {
        duplicateIds += 1;
        continue;
      }

      const date = parseStravaDate(row[index.date]);
      activities.set(id, {
        id,
        ...date,
        name,
        activityType,
        sportGroup: sportGroupFor(activityType),
        elapsedSeconds: numberValue(row, index.elapsed) ?? 0,
        movingSeconds: numberValue(row, index.moving) ?? 0,
        distanceMeters: numberValue(row, index.distance) ?? 0,
        elevationGainMeters: numberValue(row, index.elevation),
        averageSpeedMps: numberValue(row, index.averageSpeed),
        maxSpeedMps: numberValue(row, index.maxSpeed),
        averageHeartRate: numberValue(row, index.averageHeartRate),
        maxHeartRate: numberValue(row, index.maxHeartRate),
        relativeEffort: numberValue(row, index.relativeEffort),
        calories: numberValue(row, index.calories),
        averageWatts: numberValue(row, index.averageWatts),
        weightedAverageWatts: numberValue(row, index.weightedAverageWatts),
        averageCadence: numberValue(row, index.averageCadence),
        averageTemperature: numberValue(row, index.averageTemperature),
        totalSteps: numberValue(row, index.totalSteps),
        gear: stringValue(row, index.gear),
        commute: row[index.commute ?? -1]?.toLowerCase() === "true",
      });
    } catch {
      skippedRows += 1;
    }
  }

  return {
    activities: [...activities.values()].sort((a, b) =>
      b.dateLocal.localeCompare(a.dateLocal),
    ),
    diagnostics: {
      rowCount: records.length - 1,
      skippedRows,
      duplicateIds,
    },
  };
}

export class CsvActivitySource implements ActivitySource {
  constructor(private readonly filePath = path.join(process.cwd(), "activities.csv")) {}

  async getAll() {
    return parseActivitiesCsv(await readFile(this.filePath, "utf8"));
  }
}

let datasetPromise: Promise<ActivityDataset> | undefined;

export function getActivityDataset() {
  datasetPromise ??= new CsvActivitySource().getAll();
  return datasetPromise;
}
