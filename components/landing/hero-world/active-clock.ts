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

// 單一幀最多能推進多少動畫時間。這個上限不是用來抵銷低幀率——低幀率下每一幀
// 本來就該推進更多，18 秒的故事才會是 18 秒——而是擋掉「頁面仍可見但主執行緒
// 被凍住」（系統休眠、長 task）之後的一次性大跳。hidden／pause 由 suspend()
// 處理，不靠這個上限。
export const MAX_FRAME_DELTA_MS = 1_000;

/**
 * 以真實的前景時間推進的動畫時鐘。
 *
 * 每幀讀時鐘而不是累加 render delta，所以動畫速度不隨 FPS 改變；離開 active
 * （hidden、pause、離頁）時呼叫 `suspend()`，中間的 wall time 就完全不計入，
 * 恢復時也不會一次跳掉。
 */
export class ActiveTimeline {
  private readonly clock: ActiveClock;
  private last: number | null = null;
  private ms = 0;

  constructor(clock: ActiveClock = getActiveClock()) {
    this.clock = clock;
  }

  /** 目前累計的 active 秒數。 */
  get seconds(): number {
    return this.ms / 1000;
  }

  /** QA 或測試把時間點直接設定到某一秒。 */
  set seconds(value: number) {
    this.ms = Math.max(0, value) * 1000;
  }

  /** 回到零，並讓下一次 advance 從新的一段開始（重播）。 */
  reset(): void {
    this.ms = 0;
    this.last = null;
  }

  /** 暫停這一段：時間不歸零，恢復後的第一幀也不會補算空白期間。 */
  suspend(): void {
    this.last = null;
  }

  /**
   * 推進到現在，回傳這一幀實際經過的秒數。`limitSeconds` 讓呼叫端把時間軸
   * 停在終點（例如小紅的 18 秒），不必自己再 clamp 一次。
   */
  advance(limitSeconds = Number.POSITIVE_INFINITY): number {
    const now = this.clock.now();
    const previous = this.last;
    this.last = now;
    if (previous === null) return 0;
    const step = Math.min(Math.max(now - previous, 0), MAX_FRAME_DELTA_MS);
    const before = this.ms;
    this.ms = Math.min(limitSeconds * 1000, this.ms + step);
    return (this.ms - before) / 1000;
  }
}
