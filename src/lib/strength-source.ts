import "server-only";

import { getActivityDataset } from "@/lib/csv-source";
import { buildStrengthLedger } from "@/lib/strength-ledger";
import type { StrengthLedger } from "@/lib/types";
import { reconcileStrengthActivities } from "@/lib/workout-reconciliation";
import { getWorkoutDataset } from "@/lib/workout-source";

let ledgerPromise: Promise<StrengthLedger> | undefined;

export function getStrengthLedger() {
  ledgerPromise ??= Promise.all([getWorkoutDataset(), getActivityDataset()]).then(
    ([workoutDataset, activityDataset]) => {
      const reconciliation = reconcileStrengthActivities(
        workoutDataset.workouts,
        activityDataset.activities,
      );
      return buildStrengthLedger(
        workoutDataset.workouts,
        activityDataset.activities,
        reconciliation,
        true,
      );
    },
  );
  return ledgerPromise;
}
