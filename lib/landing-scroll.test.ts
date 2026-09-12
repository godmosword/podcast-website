// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  LANDING_FIRST_ANCHOR_ID,
  LANDING_SCROLL_ROOT_ATTR,
  scrollLandingToFirstSegment,
} from "./landing-scroll";

describe("scrollLandingToFirstSegment", () => {
  afterEach(() => {
    document.body.replaceChildren();
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
