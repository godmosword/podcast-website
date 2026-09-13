// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  LANDING_FIRST_ANCHOR_ID,
  LANDING_SCROLL_ROOT_ATTR,
  LANDING_SEGMENT_ENTER_MS,
  LANDING_SEGMENT_LEAVE_MS,
  resetLandingScrollTransition,
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
