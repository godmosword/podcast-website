import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@vercel/analytics", () => ({
  track: vi.fn(),
}));

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function stubStorages(): {
  local: Map<string, string>;
  session: Map<string, string>;
} {
  const local = new Map<string, string>();
  const session = new Map<string, string>();
  const asStorage = (store: Map<string, string>) => ({
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  });
  vi.stubGlobal("window", {
    localStorage: asStorage(local),
    sessionStorage: asStorage(session),
    dispatchEvent: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
  vi.stubGlobal("localStorage", asStorage(local));
  vi.stubGlobal("sessionStorage", asStorage(session));
  return { local, session };
}

describe("bucketDaysSince", () => {
  it("依天數分區間", async () => {
    const { bucketDaysSince } = await import("./return-visit");
    expect(bucketDaysSince(7 * HOUR)).toBe("same-day");
    expect(bucketDaysSince(1 * DAY)).toBe("1d");
    expect(bucketDaysSince(2 * DAY)).toBe("2-3d");
    expect(bucketDaysSince(3 * DAY + HOUR)).toBe("2-3d");
    expect(bucketDaysSince(4 * DAY)).toBe("4-7d");
    expect(bucketDaysSince(8 * DAY)).toBe("8-30d");
    expect(bucketDaysSince(30 * DAY)).toBe("8-30d");
    expect(bucketDaysSince(31 * DAY)).toBe("30d+");
  });
});

describe("pingReturnVisit", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("首訪只記 lastVisit，不送事件", async () => {
    const { local } = stubStorages();
    const { track } = await import("@vercel/analytics");
    const { pingReturnVisit, LAST_VISIT_KEY } = await import("./return-visit");

    pingReturnVisit(1_000_000);

    expect(local.get(LAST_VISIT_KEY)).toBe("1000000");
    expect(track).not.toHaveBeenCalled();
  });

  it("距上次 <6h 不送事件，但更新 lastVisit", async () => {
    const { local } = stubStorages();
    const { track } = await import("@vercel/analytics");
    const { pingReturnVisit, LAST_VISIT_KEY } = await import("./return-visit");

    const t0 = 1_000_000;
    local.set(LAST_VISIT_KEY, String(t0));
    pingReturnVisit(t0 + 5 * HOUR);

    expect(track).not.toHaveBeenCalled();
    expect(local.get(LAST_VISIT_KEY)).toBe(String(t0 + 5 * HOUR));
  });

  it("距上次 ≥6h 送 return_visit，payload 只含 daysSince bucket", async () => {
    const { local } = stubStorages();
    const { track } = await import("@vercel/analytics");
    const { pingReturnVisit, LAST_VISIT_KEY } = await import("./return-visit");

    const t0 = 1_000_000;
    local.set(LAST_VISIT_KEY, String(t0));
    pingReturnVisit(t0 + 2 * DAY);

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("return_visit", { daysSince: "2-3d" });
    const payload = vi.mocked(track).mock.calls[0]?.[1];
    expect(Object.keys(payload ?? {})).toEqual(["daysSince"]);
  });

  it("同 session 第二次呼叫不重送，但仍更新 lastVisit", async () => {
    const { local } = stubStorages();
    const { track } = await import("@vercel/analytics");
    const { pingReturnVisit, LAST_VISIT_KEY } = await import("./return-visit");

    const t0 = 1_000_000;
    local.set(LAST_VISIT_KEY, String(t0));
    pingReturnVisit(t0 + 1 * DAY);
    pingReturnVisit(t0 + 1 * DAY + HOUR);

    expect(track).toHaveBeenCalledTimes(1);
    expect(local.get(LAST_VISIT_KEY)).toBe(String(t0 + 1 * DAY + HOUR));
  });

  it("lastVisit 非數字時不送事件（自我修復基準）", async () => {
    const { local } = stubStorages();
    const { track } = await import("@vercel/analytics");
    const { pingReturnVisit, LAST_VISIT_KEY } = await import("./return-visit");

    local.set(LAST_VISIT_KEY, "not-a-number");
    pingReturnVisit(5_000_000);

    expect(track).not.toHaveBeenCalled();
    expect(local.get(LAST_VISIT_KEY)).toBe("5000000");
  });

  it("SSR／無 storage 時 no-op 不丟錯", async () => {
    const { pingReturnVisit } = await import("./return-visit");
    expect(() => pingReturnVisit()).not.toThrow();
  });
});
