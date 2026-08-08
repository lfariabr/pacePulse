import "server-only";

import { readFile } from "node:fs/promises";
import { parseWorkoutReview } from "@/lib/workout-parser";
import type { WorkoutDataset, WorkoutSource } from "@/lib/types";

export class MarkdownWorkoutSource implements WorkoutSource {
  constructor(private readonly filePath = process.env.PACEPULSE_WORKOUT_FILE) {}

  async getAll() {
    if (!this.filePath) {
      throw new Error(
        "PACEPULSE_WORKOUT_FILE must point to the private workout-review.md file.",
      );
    }
    return parseWorkoutReview(await readFile(this.filePath, "utf8"));
  }
}

let datasetPromise: Promise<WorkoutDataset> | undefined;

export function getWorkoutDataset() {
  datasetPromise ??= new MarkdownWorkoutSource().getAll().catch((error) => {
    datasetPromise = undefined;
    throw error;
  });
  return datasetPromise;
}
