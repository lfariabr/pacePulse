import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TrainingHeatmap } from "@/components/heatmap";

const days = [
  { date: "2026-08-03", activities: 0, movingMinutes: 0, level: 0 },
  { date: "2026-08-04", activities: 2, movingMinutes: 90, level: 3 },
];

describe("training heatmap labels", () => {
  it("uses the irregular activity plural on the overview", () => {
    const html = renderToStaticMarkup(<TrainingHeatmap days={days} />);
    expect(html).toContain("0 activities");
    expect(html).toContain("2 activities");
  });

  it("supports strength-specific workout labels", () => {
    const html = renderToStaticMarkup(
      <TrainingHeatmap days={days} itemLabel="workout" />,
    );
    expect(html).toContain("0 workouts");
    expect(html).toContain("2 workouts");
  });
});
