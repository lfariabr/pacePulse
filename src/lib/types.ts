export const SPORT_GROUPS = [
  "Running",
  "Cycling",
  "Swimming",
  "Strength",
  "Mobility",
  "Other",
] as const;

export type SportGroup = (typeof SPORT_GROUPS)[number];

export interface Activity {
  id: string;
  dateLocal: string;
  dateKey: string;
  monthKey: string;
  year: number;
  name: string;
  activityType: string;
  sportGroup: SportGroup;
  elapsedSeconds: number;
  movingSeconds: number;
  distanceMeters: number;
  elevationGainMeters: number | null;
  averageSpeedMps: number | null;
  maxSpeedMps: number | null;
  averageHeartRate: number | null;
  maxHeartRate: number | null;
  relativeEffort: number | null;
  calories: number | null;
  averageWatts: number | null;
  weightedAverageWatts: number | null;
  averageCadence: number | null;
  averageTemperature: number | null;
  totalSteps: number | null;
  gear: string | null;
  commute: boolean;
}

export interface ParseDiagnostics {
  rowCount: number;
  skippedRows: number;
  duplicateIds: number;
}

export interface ActivityDataset {
  activities: Activity[];
  diagnostics: ParseDiagnostics;
}

export interface ActivitySource {
  getAll(): Promise<ActivityDataset>;
}

export interface DashboardFilters {
  range: "all" | "12m" | "ytd" | "year" | "custom";
  year?: number;
  from?: string;
  to?: string;
  sportGroup?: SportGroup;
}

export interface DashboardTotals {
  activities: number;
  movingSeconds: number;
  distanceMeters: number;
  elevationGainMeters: number;
}

export interface ComparisonTotals {
  activities: number | null;
  movingSeconds: number | null;
  distanceMeters: number | null;
  elevationGainMeters: number | null;
}

export interface MonthlyVolume {
  month: string;
  label: string;
  runningHours: number;
  cyclingHours: number;
  swimmingHours: number;
  strengthHours: number;
  mobilityHours: number;
  otherHours: number;
  distanceKm: number;
  activityCount: number;
}

export interface SportBreakdown {
  sportGroup: SportGroup;
  activities: number;
  movingSeconds: number;
  distanceMeters: number;
  percentage: number;
}

export interface AnnualSummary {
  year: number;
  activities: number;
  movingSeconds: number;
  distanceMeters: number;
  elevationGainMeters: number;
  isPartial: boolean;
}

export interface HeatmapDay {
  date: string;
  activities: number;
  movingMinutes: number;
  level: number;
}

export interface ActivityRecord {
  label: string;
  value: string;
  detail: string;
  activity: Activity;
}

export interface DashboardSummary {
  filters: DashboardFilters;
  periodLabel: string;
  datasetStart: string;
  datasetEnd: string;
  totals: DashboardTotals;
  comparison: ComparisonTotals | null;
  monthly: MonthlyVolume[];
  sportBreakdown: SportBreakdown[];
  annual: AnnualSummary[];
  heatmap: HeatmapDay[];
  records: ActivityRecord[];
  recent: Activity[];
  availableYears: number[];
}

export type ExplorerSort = "date" | "distance" | "duration" | "elevation";
export type SortDirection = "asc" | "desc";

export interface ExplorerFilters {
  q?: string;
  sportGroup?: SportGroup;
  activityType?: string;
  year?: number;
  sort: ExplorerSort;
  direction: SortDirection;
  page: number;
  pageSize: number;
}

export interface ExplorerResult {
  activities: Activity[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  availableYears: number[];
  activityTypes: string[];
}
