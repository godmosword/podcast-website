import { describe, expect, it } from "vitest";
import { isLocalBedtimeHour } from "./bedtime";

describe("bedtime", () => {
  it("19:00–05:59 為睡前窗", () => {
    expect(isLocalBedtimeHour(19)).toBe(true);
    expect(isLocalBedtimeHour(23)).toBe(true);
    expect(isLocalBedtimeHour(0)).toBe(true);
    expect(isLocalBedtimeHour(5)).toBe(true);
  });

  it("06:00–18:59 為日間", () => {
    expect(isLocalBedtimeHour(6)).toBe(false);
    expect(isLocalBedtimeHour(12)).toBe(false);
    expect(isLocalBedtimeHour(18)).toBe(false);
  });
});
