// @vitest-environment jsdom
import React, { act, useRef } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LandingScrollContext } from "./LandingScrollContext";
import { useActiveLandingAnchor } from "./useActiveLandingAnchor";

vi.stubGlobal("React", React);
vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);

const IDS = ["segment-stories", "segment-bedtime"] as const;

function box(el: Element, top: number, height: number) {
  vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
    top,
    bottom: top + height,
    height,
  } as DOMRect);
}

function addSegment(id: string, top: number): HTMLElement {
  const el = document.createElement("section");
  el.id = id;
  document.body.append(el);
  box(el, top, 800);
  return el;
}

function Probe({ scrollRoot }: { scrollRoot: HTMLDivElement }) {
  const ref = useRef<HTMLDivElement | null>(scrollRoot);
  return (
    <LandingScrollContext.Provider
      value={{ scrollRootRef: ref, scrollToSegment: () => {} }}
    >
      <Active />
    </LandingScrollContext.Provider>
  );
}

function Active() {
  const active = useActiveLandingAnchor(IDS);
  return <output>{active ?? "none"}</output>;
}

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("useActiveLandingAnchor", () => {
  // 2026-10-25：首頁段落在串流／hydration 時會被換成新節點。原本 IntersectionObserver
  // 只在掛載時抓一次節點，抓到舊的就永遠不回報，夜色與嘟嘟表情停在第一段。
  it("段落節點被換掉之後捲動，仍然切到該段", async () => {
    const scrollRoot = document.createElement("div");
    document.body.append(scrollRoot);
    box(scrollRoot, 0, 800);
    addSegment("segment-stories", 0);
    const staleBedtime = addSegment("segment-bedtime", 800);

    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    await act(async () => {
      root.render(<Probe scrollRoot={scrollRoot} />);
    });
    expect(host.textContent).toBe("segment-stories");

    staleBedtime.remove();
    const stories = document.getElementById("segment-stories")!;
    box(stories, -800, 800);
    addSegment("segment-bedtime", 0);

    await act(async () => {
      scrollRoot.dispatchEvent(new Event("scroll"));
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    });
    expect(host.textContent).toBe("segment-bedtime");

    await act(async () => root.unmount());
  });
});
