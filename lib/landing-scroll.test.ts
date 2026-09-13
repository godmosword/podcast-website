// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  LANDING_FIRST_ANCHOR_ID,
  LANDING_SCROLL_ROOT_ATTR,
  LANDING_SEGMENT_ENTER_MS,
  LANDING_SEGMENT_LEAVE_MS,
  LANDING_WHEEL_IDLE_MS,
  LANDING_WHEEL_LINE_PX,
  LANDING_WHEEL_THRESHOLD_PX,
  bindLandingWheel,
  isLandingScrollTransitionPending,
  normalizeLandingWheelDelta,
  planLandingWheelEvent,
  resetLandingScrollTransition,
  resolveLandingNeighborAnchor,
  resolveLandingWheelDirection,
  scrollLandingToFirstSegment,
  transitionLandingToAnchor,
} from "./landing-scroll";

function mockRect(el: HTMLElement, top: number) {
  vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
    top,
  } as DOMRect);
}

describe("scrollLandingToFirstSegment", () => {
  afterEach(() => {
    document.body.replaceChildren();
    resetLandingScrollTransition();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("第一屏錨點是 segment-stories", () => {
    expect(LANDING_FIRST_ANCHOR_ID).toBe("segment-stories");
  });

  it("沒有 Landing 捲動根時回 false", () => {
    expect(scrollLandingToFirstSegment()).toBe(false);
  });

  it("把內部容器捲到第一段，不碰 window", () => {
    const root = document.createElement("div");
    root.setAttribute(LANDING_SCROLL_ROOT_ATTR, "");
    const first = document.createElement("section");
    first.id = LANDING_FIRST_ANCHOR_ID;
    root.append(first);
    document.body.append(root);

    Object.defineProperty(root, "scrollTop", { value: 2400, writable: true });
    vi.spyOn(root, "getBoundingClientRect").mockReturnValue({
      top: 64,
    } as DOMRect);
    vi.spyOn(first, "getBoundingClientRect").mockReturnValue({
      top: -2336,
    } as DOMRect);
    const scrollTo = vi.fn();
    root.scrollTo = scrollTo;
    const windowScrollTo = vi.spyOn(window, "scrollTo");

    expect(scrollLandingToFirstSegment()).toBe(true);
    expect(scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: "auto",
    });
    expect(windowScrollTo).not.toHaveBeenCalled();
  });
});

describe("transitionLandingToAnchor", () => {
  afterEach(() => {
    document.body.replaceChildren();
    resetLandingScrollTransition();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function mountTwoSegments() {
    const root = document.createElement("div");
    root.setAttribute(LANDING_SCROLL_ROOT_ATTR, "");
    const first = document.createElement("section");
    first.id = LANDING_FIRST_ANCHOR_ID;
    const next = document.createElement("section");
    next.id = "segment-bedtime";
    root.append(first, next);
    document.body.append(root);
    Object.defineProperty(root, "scrollTop", { value: 0, writable: true });
    mockRect(root, 64);
    mockRect(first, 64);
    mockRect(next, 732);
    const scrollTo = vi.fn();
    root.scrollTo = scrollTo;
    return { root, first, next, scrollTo };
  }

  it("reduced-motion 立刻 auto 捲、不寫 phase", async () => {
    const { first, next, scrollTo } = mountTwoSegments();
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query) =>
        ({
          matches: String(query).includes("prefers-reduced-motion"),
          media: String(query),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }) as unknown as MediaQueryList,
    );

    await expect(transitionLandingToAnchor(next.id)).resolves.toBe(true);
    expect(scrollTo).toHaveBeenCalledWith({ top: 668, behavior: "auto" });
    expect(first.getAttribute("data-landing-phase")).toBeNull();
    expect(next.getAttribute("data-landing-phase")).toBeNull();
  });

  it("先 leave 再 auto 對齊，最後清掉 enter", async () => {
    vi.useFakeTimers();
    const { first, next, scrollTo } = mountTwoSegments();

    const done = transitionLandingToAnchor(next.id);
    expect(first.getAttribute("data-landing-phase")).toBe("leave");
    expect(scrollTo).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(LANDING_SEGMENT_LEAVE_MS);
    expect(scrollTo).toHaveBeenCalledWith({ top: 668, behavior: "auto" });
    expect(first.getAttribute("data-landing-phase")).toBeNull();
    expect(next.getAttribute("data-landing-phase")).toBe("enter");

    await vi.advanceTimersByTimeAsync(LANDING_SEGMENT_ENTER_MS);
    expect(next.getAttribute("data-landing-phase")).toBeNull();
    await expect(done).resolves.toBe(true);
  });
});

describe("landing wheel intent", () => {
  afterEach(() => {
    document.body.replaceChildren();
    resetLandingScrollTransition();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("把一行／一頁 delta 收成像素", () => {
    expect(normalizeLandingWheelDelta({ deltaY: 2, deltaMode: 1 })).toBe(
      2 * LANDING_WHEEL_LINE_PX,
    );
    expect(normalizeLandingWheelDelta({ deltaY: 1, deltaMode: 2 }, 800)).toBe(800);
    expect(normalizeLandingWheelDelta({ deltaY: 40, deltaMode: 0 })).toBe(40);
  });

  it("觸控板要累積過門檻才換段", () => {
    expect(resolveLandingWheelDirection(LANDING_WHEEL_THRESHOLD_PX - 1)).toBe(0);
    expect(resolveLandingWheelDirection(LANDING_WHEEL_THRESHOLD_PX)).toBe(1);
    expect(resolveLandingWheelDirection(-LANDING_WHEEL_THRESHOLD_PX)).toBe(-1);
  });

  it("滑鼠一行立刻換段，縮放與橫向不攔截", () => {
    const base = {
      deltaY: 3,
      deltaMode: 1,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      reducedMotion: false,
      locked: false,
      accumulatedPx: 0,
    };
    expect(planLandingWheelEvent(base)).toEqual({
      preventDefault: true,
      nextAccumulatedPx: 0,
      direction: 1,
    });
    expect(planLandingWheelEvent({ ...base, ctrlKey: true }).preventDefault).toBe(
      false,
    );
    expect(
      planLandingWheelEvent({
        ...base,
        deltaMode: 0,
        deltaY: 10,
        deltaX: 80,
      }).preventDefault,
    ).toBe(false);
    expect(
      planLandingWheelEvent({
        ...base,
        reducedMotion: true,
        accumulatedPx: 40,
      }),
    ).toEqual({
      preventDefault: false,
      nextAccumulatedPx: 0,
      direction: 0,
    });
  });

  it("鎖定中只擋原生捲、不累積", () => {
    expect(
      planLandingWheelEvent({
        deltaY: 120,
        deltaMode: 0,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        reducedMotion: false,
        locked: true,
        accumulatedPx: 40,
      }),
    ).toEqual({ preventDefault: true, nextAccumulatedPx: 0, direction: 0 });
  });
});

describe("resolveLandingNeighborAnchor", () => {
  afterEach(() => {
    document.body.replaceChildren();
    resetLandingScrollTransition();
    vi.restoreAllMocks();
  });

  function mountThree() {
    const root = document.createElement("div");
    root.setAttribute(LANDING_SCROLL_ROOT_ATTR, "");
    const first = document.createElement("section");
    first.id = LANDING_FIRST_ANCHOR_ID;
    const mid = document.createElement("section");
    mid.id = "segment-bedtime";
    const last = document.createElement("section");
    last.id = "segment-health";
    root.append(first, mid, last);
    document.body.append(root);
    mockRect(root, 64);
    mockRect(first, 64);
    mockRect(mid, 732);
    mockRect(last, 1400);
    return { root, first, mid, last };
  }

  it("往下找下一段，兩端不循環", () => {
    const { root, first, last } = mountThree();
    mockRect(first, 64);
    expect(resolveLandingNeighborAnchor(1, { root })).toBe("segment-bedtime");
    mockRect(first, -1200);
    mockRect(last, 64);
    expect(resolveLandingNeighborAnchor(1, { root })).toBeNull();
    expect(resolveLandingNeighborAnchor(-1, { root })).toBe("segment-bedtime");
  });

  it("wrap 時最後一段往下回到第一屏", () => {
    const { root, first, last } = mountThree();
    mockRect(first, -1300);
    mockRect(last, 64);
    expect(resolveLandingNeighborAnchor(1, { root, wrap: true })).toBe(
      LANDING_FIRST_ANCHOR_ID,
    );
  });
});

describe("bindLandingWheel", () => {
  afterEach(() => {
    document.body.replaceChildren();
    resetLandingScrollTransition();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function mountTwoSegments() {
    const root = document.createElement("div");
    root.setAttribute(LANDING_SCROLL_ROOT_ATTR, "");
    const first = document.createElement("section");
    first.id = LANDING_FIRST_ANCHOR_ID;
    const next = document.createElement("section");
    next.id = "segment-bedtime";
    root.append(first, next);
    document.body.append(root);
    Object.defineProperty(root, "scrollTop", { value: 0, writable: true });
    mockRect(root, 64);
    mockRect(first, 64);
    mockRect(next, 732);
    const scrollTo = vi.fn();
    root.scrollTo = scrollTo;
    return { root, first, next, scrollTo };
  }

  it("往下滾先 leave 再對齊，手勢未停不連跳", async () => {
    vi.useFakeTimers();
    const { root, first, next, scrollTo } = mountTwoSegments();
    const unbind = bindLandingWheel(root, { reducedMotion: () => false });

    const firstWheel = new WheelEvent("wheel", {
      deltaY: 80,
      deltaMode: 0,
      cancelable: true,
    });
    expect(root.dispatchEvent(firstWheel)).toBe(false);
    expect(firstWheel.defaultPrevented).toBe(true);
    expect(isLandingScrollTransitionPending()).toBe(true);
    expect(first.getAttribute("data-landing-phase")).toBe("leave");

    const during = new WheelEvent("wheel", {
      deltaY: 80,
      deltaMode: 0,
      cancelable: true,
    });
    root.dispatchEvent(during);
    expect(during.defaultPrevented).toBe(true);
    expect(scrollTo).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(LANDING_SEGMENT_LEAVE_MS);
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(next.getAttribute("data-landing-phase")).toBe("enter");

    await vi.advanceTimersByTimeAsync(LANDING_SEGMENT_ENTER_MS);
    expect(isLandingScrollTransitionPending()).toBe(false);

    mockRect(first, -668);
    mockRect(next, 64);
    const leftover = new WheelEvent("wheel", {
      deltaY: 80,
      deltaMode: 0,
      cancelable: true,
    });
    root.dispatchEvent(leftover);
    expect(leftover.defaultPrevented).toBe(true);
    expect(scrollTo).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(LANDING_WHEEL_IDLE_MS);
    unbind();
  });

  it("reduced-motion 不攔截，交給原生捲", () => {
    const { root, first, scrollTo } = mountTwoSegments();
    const unbind = bindLandingWheel(root, { reducedMotion: () => true });
    const wheel = new WheelEvent("wheel", {
      deltaY: 120,
      deltaMode: 0,
      cancelable: true,
    });
    expect(root.dispatchEvent(wheel)).toBe(true);
    expect(wheel.defaultPrevented).toBe(false);
    expect(first.getAttribute("data-landing-phase")).toBeNull();
    expect(scrollTo).not.toHaveBeenCalled();
    unbind();
  });

  it("圓鈕轉場期間的滾輪會進入冷卻，結束後不連跳", async () => {
    vi.useFakeTimers();
    const root = document.createElement("div");
    root.setAttribute(LANDING_SCROLL_ROOT_ATTR, "");
    const first = document.createElement("section");
    first.id = LANDING_FIRST_ANCHOR_ID;
    const mid = document.createElement("section");
    mid.id = "segment-bedtime";
    const last = document.createElement("section");
    last.id = "segment-health";
    root.append(first, mid, last);
    document.body.append(root);
    Object.defineProperty(root, "scrollTop", { value: 0, writable: true });
    mockRect(root, 64);
    mockRect(first, 64);
    mockRect(mid, 732);
    mockRect(last, 1400);
    const scrollTo = vi.fn();
    root.scrollTo = scrollTo;

    const unbind = bindLandingWheel(root, { reducedMotion: () => false });
    const done = transitionLandingToAnchor(mid.id);
    const during = new WheelEvent("wheel", {
      deltaY: 80,
      deltaMode: 0,
      cancelable: true,
    });
    root.dispatchEvent(during);
    expect(during.defaultPrevented).toBe(true);

    await vi.advanceTimersByTimeAsync(
      LANDING_SEGMENT_LEAVE_MS + LANDING_SEGMENT_ENTER_MS,
    );
    await expect(done).resolves.toBe(true);
    expect(scrollTo).toHaveBeenCalledTimes(1);

    mockRect(first, -668);
    mockRect(mid, 64);
    mockRect(last, 732);
    const leftover = new WheelEvent("wheel", {
      deltaY: 80,
      deltaMode: 0,
      cancelable: true,
    });
    root.dispatchEvent(leftover);
    expect(leftover.defaultPrevented).toBe(true);
    expect(scrollTo).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(LANDING_WHEEL_IDLE_MS);
    unbind();
  });
});
