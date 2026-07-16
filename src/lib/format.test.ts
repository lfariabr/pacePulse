import { describe, expect, it } from "vitest";
import { formatDistance } from "@/lib/format";

describe("distance formatting", () => {
  it("groups large kilometre totals for dashboard readability", () => {
    expect(formatDistance(45_794_700)).toBe("45,795 km");
  });

  it("keeps a decimal for normal activity distances", () => {
    expect(formatDistance(14_829.9)).toBe("14.8 km");
  });

  it("uses metres below one kilometre", () => {
    expect(formatDistance(750)).toBe("750 m");
  });
});
