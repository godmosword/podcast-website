// Active-time budgets from SPEC §8. A stalled load gives up after
// LOAD_TIMEOUT_MS of active, foreground time, and secondary motion sleeps
// after SLEEP_AFTER_MS. Wall-clock time spent hidden or paused never counts.
export const LOAD_TIMEOUT_MS = 15_000;
export const SLEEP_AFTER_MS = 24_000;
export const TICK_MS = 250;
// A single tick can never contribute more than this, so a suspended tab that
// wakes up late cannot burn the whole budget in one step.
export const MAX_TICK_DELTA_MS = 1_000;

export type ActiveClock = {
  now: () => number;
  setInterval: (handler: () => void, ms: number) => number;
  clearInterval: (id: number) => void;
};

export const systemActiveClock: ActiveClock = {
  now: () => performance.now(),
  setInterval: (handler, ms) => window.setInterval(handler, ms),
  clearInterval: (id) => window.clearInterval(id),
};

// Tests replace the clock through this global: Vitest assigns it directly and
// Playwright installs it with addInitScript, so the 15s/24s budgets can be
// exercised without waiting real time. Production code never writes it.
export const ACTIVE_CLOCK_GLOBAL = "__chechecarHeroActiveClock";

type ClockHost = typeof globalThis & { [ACTIVE_CLOCK_GLOBAL]?: unknown };

function isActiveClock(value: unknown): value is ActiveClock {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<ActiveClock>;
  return typeof candidate.now === "function"
    && typeof candidate.setInterval === "function"
    && typeof candidate.clearInterval === "function";
}

export function getActiveClock(): ActiveClock {
  if (typeof globalThis === "undefined") return systemActiveClock;
  const injected = (globalThis as ClockHost)[ACTIVE_CLOCK_GLOBAL];
  return isActiveClock(injected) ? injected : systemActiveClock;
}
