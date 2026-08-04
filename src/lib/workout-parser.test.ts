import { describe, expect, it } from "vitest";
import { parseWorkoutReview } from "@/lib/workout-parser";

const REVIEW = `# Workout Review

### Workout candidate

- [ ] Reviewed
- **Source:** \`months/example.md\`
- **Date context:** 02st day of January 2026
- **Log:** - [X] 05h00 to 05h50 Gym workout Quads + 100 pull ups (160/2,000) + 40 push ups

    - Private exercise detail that must not be serialized

---

### Workout candidate

- [ ] Reviewed
- **Source:** \`months/example.md\`
- **Date context:** 03rd day of January 2026
- **Log:** - [X] 07h45 to 09h10 Gym workout + 15 min rowing (3,000m) + 20 min treadmill

---
`;

describe("War Room workout review parsing", () => {
  it("normalizes dashboard-safe workout facts without retaining source prose", () => {
    const dataset = parseWorkoutReview(REVIEW);

    expect(dataset.diagnostics).toEqual({
      candidateCount: 2,
      parsedCount: 2,
      skippedCount: 0,
      warnings: [],
    });
    expect(dataset.workouts[1]).toMatchObject({
      source: "war-room",
      dateLocal: "2026-01-02T05:00:00",
      dateKey: "2026-01-02",
      monthKey: "2026-01",
      year: 2026,
      name: "Quads workout",
      focus: "Quads",
      durationSeconds: 3000,
      pullUps: 100,
      pushUps: 40,
      pullUpMonthTotal: 160,
      pullUpMonthTarget: 2000,
      conditioning: [],
    });
    expect(JSON.stringify(dataset.workouts)).not.toContain("Private exercise detail");
    expect(JSON.stringify(dataset.workouts)).not.toContain("months/example.md");
  });

  it("extracts multiple conditioning efforts and keeps absent counts null", () => {
    const workout = parseWorkoutReview(REVIEW).workouts[0];

    expect(workout.focus).toBe("Conditioning");
    expect(workout.pullUps).toBeNull();
    expect(workout.pushUps).toBeNull();
    expect(workout.conditioning).toEqual([
      {
        kind: "Rowing",
        durationMinutes: 15,
        distanceMeters: 3000,
        averageWatts: null,
      },
      {
        kind: "Treadmill",
        durationMinutes: 20,
        distanceMeters: null,
        averageWatts: null,
      },
    ]);
  });

  it("skips malformed candidates with non-sensitive diagnostics", () => {
    const malformed = `### Workout candidate

- **Date context:** 31st day of February 2026
- **Log:** - [X] 25h00 to 25h45 Gym workout Chest

### Workout candidate

- **Log:** - [X] Gym workout Arms
`;
    const dataset = parseWorkoutReview(malformed);

    expect(dataset.workouts).toEqual([]);
    expect(dataset.diagnostics).toEqual({
      candidateCount: 2,
      parsedCount: 0,
      skippedCount: 2,
      warnings: [
        { candidate: 1, code: "invalid-date" },
        { candidate: 1, code: "invalid-time" },
        { candidate: 2, code: "missing-date" },
        { candidate: 2, code: "missing-time" },
      ],
    });
  });
});
