import { describe, expect, it } from "vitest";
import { formatDistance, formatLocalTime, formatNumber } from "@/lib/format";

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

describe("strength formatting", () => {
  it("formats local training time and grouped counts without shifting timezone", () => {
    expect(formatLocalTime("2026-08-04T05:00:00")).toBe("5:00 am");
    expect(formatNumber(15965)).toBe("15,965");
  });
});
