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

export const WORKOUT_FOCI = [
  "Hamstrings",
  "Chest",
  "Core",
  "Quads",
  "Shoulders",
  "Arms",
  "Deadlifts",
  "Pull-ups",
  "Conditioning",
  "General",
] as const;

export type WorkoutFocus = (typeof WORKOUT_FOCI)[number];

export type ConditioningKind = "Bike" | "Elliptical" | "Rowing" | "Treadmill";

export interface ConditioningEffort {
  kind: ConditioningKind;
  durationMinutes: number | null;
  distanceMeters: number | null;
  averageWatts: number | null;
}

export interface Workout {
  id: string;
  source: "war-room";
  dateLocal: string;
  dateKey: string;
  monthKey: string;
  year: number;
  name: string;
  focus: WorkoutFocus;
  durationSeconds: number;
  pullUps: number | null;
  pushUps: number | null;
  pullUpMonthTotal: number | null;
  pullUpMonthTarget: number | null;
  conditioning: ConditioningEffort[];
}

export type WorkoutParseWarningCode =
  | "missing-date"
  | "invalid-date"
  | "missing-time"
  | "invalid-time"
  | "not-reviewed";

export interface WorkoutParseWarning {
  candidate: number;
  code: WorkoutParseWarningCode;
}

export interface WorkoutParseDiagnostics {
  candidateCount: number;
  parsedCount: number;
  skippedCount: number;
  warnings: WorkoutParseWarning[];
}

export interface WorkoutDataset {
  workouts: Workout[];
  diagnostics: WorkoutParseDiagnostics;
}

export interface WorkoutSource {
  getAll(): Promise<WorkoutDataset>;
}

export type StrengthMatchStrategy = "same-wall-clock" | "sydney-offset";
export type StrengthMatchConfidence = "confident" | "possible";

export interface StrengthActivityMatch {
  workoutId: string;
  activityId: string;
  strategy: StrengthMatchStrategy;
  confidence: StrengthMatchConfidence;
  startDeltaMinutes: number;
  durationDeltaMinutes: number;
}

export interface StrengthReconciliation {
  workoutCount: number;
  stravaStrengthCount: number;
  matches: StrengthActivityMatch[];
  unmatchedWorkoutIds: string[];
  unmatchedActivityIds: string[];
}

export type StrengthSessionSource = "war-room" | "strava" | "combined";

export interface StrengthSession {
  id: string;
  source: StrengthSessionSource;
  matchConfidence: StrengthMatchConfidence | null;
  activityId: string | null;
  dateLocal: string;
  dateKey: string;
  monthKey: string;
  year: number;
  name: string;
  focus: WorkoutFocus;
  durationSeconds: number;
  pullUps: number | null;
  pushUps: number | null;
  pullUpMonthTotal: number | null;
  pullUpMonthTarget: number | null;
  conditioning: ConditioningEffort[];
}

export interface StrengthLedgerDiagnostics {
  warRoomWorkouts: number;
  stravaStrengthActivities: number;
  confidentDuplicates: number;
  acceptedPossibleDuplicates: number;
  stravaOnlySessions: number;
}

export interface StrengthLedger {
  sessions: StrengthSession[];
  diagnostics: StrengthLedgerDiagnostics;
}

export interface MonthlyStrength {
  month: string;
  label: string;
  sessions: number;
  durationSeconds: number;
  pullUps: number;
  pushUps: number;
}

export interface StrengthFocusBreakdown {
  focus: WorkoutFocus;
  sessions: number;
  durationSeconds: number;
  percentage: number;
}

export interface StrengthSummary {
  datasetStart: string;
  datasetEnd: string;
  sessions: number;
  activeDays: number;
  durationSeconds: number;
  pullUps: number;
  pushUps: number;
  monthly: MonthlyStrength[];
  focusBreakdown: StrengthFocusBreakdown[];
  heatmap: HeatmapDay[];
  recent: StrengthSession[];
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

export type RecentEntry =
  | { kind: "activity"; data: Activity }
  | { kind: "strength"; data: StrengthSession };

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
