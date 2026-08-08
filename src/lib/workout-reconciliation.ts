import type {
  Activity,
  StrengthActivityMatch,
  StrengthMatchStrategy,
  StrengthReconciliation,
  Workout,
} from "@/lib/types";

const CONFIDENT_START_DELTA_MINUTES = 20;
const CONFIDENT_DURATION_DELTA_MINUTES = 20;
const POSSIBLE_START_DELTA_MINUTES = 30;
const POSSIBLE_DURATION_DELTA_MINUTES = 45;

function timestamp(value: string) {
  return new Date(`${value}Z`).getTime();
}

function minutesBetween(left: number, right: number) {
  return Math.round(Math.abs(left - right) / 60_000);
}

function shiftDate(dateKey: string, days: number) {
  const value = new Date(`${dateKey}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

interface CandidateMatch extends StrengthActivityMatch {
  score: number;
}

function candidateMatch(workout: Workout, activity: Activity): CandidateMatch | null {
  const workoutStart = timestamp(workout.dateLocal);
  const activityStart = timestamp(activity.dateLocal);
  const directDelta = minutesBetween(workoutStart, activityStart);
  const offsetDelta = Math.min(
    minutesBetween(workoutStart, activityStart + 10 * 60 * 60 * 1000),
    minutesBetween(workoutStart, activityStart + 11 * 60 * 60 * 1000),
  );
  const strategy: StrengthMatchStrategy =
    directDelta <= offsetDelta ? "same-wall-clock" : "sydney-offset";
  const startDeltaMinutes = Math.min(directDelta, offsetDelta);
  const durationDeltaMinutes = Math.round(
    Math.abs(workout.durationSeconds - activity.elapsedSeconds) / 60,
  );

  if (
    startDeltaMinutes > POSSIBLE_START_DELTA_MINUTES ||
    durationDeltaMinutes > POSSIBLE_DURATION_DELTA_MINUTES
  ) {
    return null;
  }

  const confidence =
    startDeltaMinutes <= CONFIDENT_START_DELTA_MINUTES &&
    durationDeltaMinutes <= CONFIDENT_DURATION_DELTA_MINUTES
      ? "confident"
      : "possible";

  return {
    workoutId: workout.id,
    activityId: activity.id,
    strategy,
    confidence,
    startDeltaMinutes,
    durationDeltaMinutes,
    score: (confidence === "confident" ? 0 : 1000) + startDeltaMinutes + durationDeltaMinutes,
  };
}

export function reconcileStrengthActivities(
  workouts: Workout[],
  activities: Activity[],
): StrengthReconciliation {
  if (!workouts.length) {
    return {
      workoutCount: 0,
      stravaStrengthCount: 0,
      matches: [],
      unmatchedWorkoutIds: [],
      unmatchedActivityIds: [],
    };
  }

  const from = workouts.reduce((minimum, item) =>
    item.dateKey < minimum ? item.dateKey : minimum, workouts[0].dateKey);
  const to = workouts.reduce((maximum, item) =>
    item.dateKey > maximum ? item.dateKey : maximum, workouts[0].dateKey);
  const reconciliationFrom = shiftDate(from, -1);
  const strengthActivities = activities.filter(
    (activity) =>
      activity.sportGroup === "Strength" &&
      activity.dateKey >= reconciliationFrom &&
      activity.dateKey <= to,
  );

  const candidates = workouts.flatMap((workout) =>
    strengthActivities.flatMap((activity) => {
      const match = candidateMatch(workout, activity);
      return match ? [match] : [];
    }),
  ).sort((a, b) => a.score - b.score);

  const workoutIds = new Set<string>();
  const activityIds = new Set<string>();
  const matches: StrengthActivityMatch[] = [];

  for (const candidate of candidates) {
    if (workoutIds.has(candidate.workoutId) || activityIds.has(candidate.activityId)) continue;
    workoutIds.add(candidate.workoutId);
    activityIds.add(candidate.activityId);
    const { score: _, ...match } = candidate;
    void _;
    matches.push(match);
  }

  return {
    workoutCount: workouts.length,
    stravaStrengthCount: strengthActivities.length,
    matches,
    unmatchedWorkoutIds: workouts
      .filter((workout) => !workoutIds.has(workout.id))
      .map((workout) => workout.id),
    unmatchedActivityIds: strengthActivities
      .filter((activity) => !activityIds.has(activity.id))
      .map((activity) => activity.id),
  };
}

export function formatStrengthReconciliation(result: StrengthReconciliation) {
  const confidentMatches = result.matches.filter(
    (match) => match.confidence === "confident",
  ).length;
  const possibleMatches = result.matches.length - confidentMatches;
  const offsetMatches = result.matches.filter(
    (match) => match.strategy === "sydney-offset",
  ).length;
  return [
    `War Room workouts: ${result.workoutCount}`,
    `Strava strength activities in range: ${result.stravaStrengthCount}`,
    `Confident duplicates: ${confidentMatches}`,
    `Possible duplicates requiring review: ${possibleMatches}`,
    `Probable timezone-shifted duplicates: ${offsetMatches}`,
    `War Room-only workouts: ${result.unmatchedWorkoutIds.length}`,
    `Strava-only strength activities: ${result.unmatchedActivityIds.length}`,
  ].join("\n");
}
