import { afterEach, describe, expect, it } from "vitest";
import { ACTIVE_CLOCK_GLOBAL, getActiveClock, systemActiveClock } from "./active-clock";

type ClockHost = typeof globalThis & { [ACTIVE_CLOCK_GLOBAL]?: unknown };

afterEach(() => {
  delete (globalThis as ClockHost)[ACTIVE_CLOCK_GLOBAL];
});

describe("getActiveClock", () => {
  it("uses the system clock when nothing is injected", () => {
    expect(getActiveClock()).toBe(systemActiveClock);
  });

  it("uses an injected clock so active-time budgets are testable", () => {
    const injected = { now: () => 42, setInterval: () => 1, clearInterval: () => {} };
    (globalThis as ClockHost)[ACTIVE_CLOCK_GLOBAL] = injected;
    expect(getActiveClock()).toBe(injected);
    expect(getActiveClock().now()).toBe(42);
  });

  it("ignores a malformed injection instead of crashing the scene", () => {
    (globalThis as ClockHost)[ACTIVE_CLOCK_GLOBAL] = { now: () => 0 };
    expect(getActiveClock()).toBe(systemActiveClock);
  });
});
