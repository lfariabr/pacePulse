import type {
  Activity,
  StrengthLedger,
  StrengthReconciliation,
  StrengthSession,
  Workout,
} from "@/lib/types";

export function buildStrengthLedger(
  workouts: Workout[],
  activities: Activity[],
  reconciliation: StrengthReconciliation,
  acceptPossibleDuplicates: boolean,
): StrengthLedger {
  const acceptedMatches = reconciliation.matches.filter(
    (match) => match.confidence === "confident" || acceptPossibleDuplicates,
  );
  const matchByWorkout = new Map(
    acceptedMatches.map((match) => [match.workoutId, match]),
  );
  const matchedActivityIds = new Set(
    acceptedMatches.map((match) => match.activityId),
  );
  const reconciledActivityIds = new Set([
    ...reconciliation.unmatchedActivityIds,
    ...reconciliation.matches.map((match) => match.activityId),
  ]);

  const workoutSessions: StrengthSession[] = workouts.map((workout) => {
    const match = matchByWorkout.get(workout.id);
    return {
      ...workout,
      source: match ? "combined" : "war-room",
      matchConfidence: match?.confidence ?? null,
    };
  });

  const stravaSessions: StrengthSession[] = activities
    .filter(
      (activity) =>
        activity.sportGroup === "Strength" &&
        !matchedActivityIds.has(activity.id) &&
        reconciledActivityIds.has(activity.id),
    )
    .map((activity) => ({
      id: `strava:${activity.id}`,
      source: "strava",
      matchConfidence: null,
      dateLocal: activity.dateLocal,
      dateKey: activity.dateKey,
      monthKey: activity.monthKey,
      year: activity.year,
      name: activity.name,
      focus: "General",
      durationSeconds: activity.elapsedSeconds,
      pullUps: null,
      pushUps: null,
      pullUpMonthTotal: null,
      pullUpMonthTarget: null,
      conditioning: [],
    }));

  return {
    sessions: [...workoutSessions, ...stravaSessions].sort((a, b) =>
      b.dateLocal.localeCompare(a.dateLocal),
    ),
    diagnostics: {
      warRoomWorkouts: workouts.length,
      stravaStrengthActivities: reconciliation.stravaStrengthCount,
      confidentDuplicates: acceptedMatches.filter(
        (match) => match.confidence === "confident",
      ).length,
      acceptedPossibleDuplicates: acceptedMatches.filter(
        (match) => match.confidence === "possible",
      ).length,
      stravaOnlySessions: stravaSessions.length,
    },
  };
}
