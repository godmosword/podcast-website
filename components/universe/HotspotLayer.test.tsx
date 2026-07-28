// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mapDepthZ } from "@/lib/universe-depth";
import { resolvedZoneById } from "@/lib/universe/hotspot";
import HotspotLayer from "./HotspotLayer";

const prefetch = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ prefetch, push: vi.fn(), back: vi.fn() }),
}));

vi.mock("next/link", () => {
  /** next/link 專屬 props：不能原封轉發給 <a>（React 會警告未知屬性）。 */
  const LINK_ONLY_PROPS = new Set(["prefetch", "scroll"]);
  return {
    default: ({
      children,
      ...props
    }: { children: React.ReactNode } & Record<string, unknown>) => (
      <a
        {...(Object.fromEntries(
          Object.entries(props).filter(([key]) => !LINK_ONLY_PROPS.has(key)),
        ) as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </a>
    ),
  };
});

describe("HotspotLayer", () => {
  afterEach(() => {
    cleanup();
    prefetch.mockClear();
  });

  it("恐龍島渲染種子熱點並 prefetch", () => {
    render(<HotspotLayer zoneId="dino" />);
    expect(screen.getByLabelText("打開故事屋入口").getAttribute("href")).toBe(
      "/adventures/dino/story-house",
    );
    expect(
      screen.getByLabelText("恐龍巢穴（尚未開放）").getAttribute("href"),
    ).toBe("/adventures/dino/dino-nest");
    expect(prefetch).toHaveBeenCalled();
    expect(prefetch.mock.calls.flat()).toContain(
      "/adventures/dino/story-house",
    );
  });

  it("其他島（海洋）也渲染 M3 熱點", () => {
    render(<HotspotLayer zoneId="ocean" />);
    expect(
      screen.getByLabelText("打開水上樂園門口").getAttribute("href"),
    ).toBe("/adventures/ocean/wave-park");
    expect(screen.getByLabelText("夢想碼頭（尚未開放）")).toBeTruthy();
  });

  it("探索點層走 hotspot band，高於島名木牌", () => {
    const { container } = render(<HotspotLayer zoneId="dino" />);
    const layer = container.firstElementChild as HTMLElement;
    const dino = resolvedZoneById("dino")!;

    expect(Number(layer.style.zIndex)).toBe(mapDepthZ(dino.depthY, "hotspot"));
    expect(Number(layer.style.zIndex)).toBeGreaterThan(
      mapDepthZ(dino.depthY, "label"),
    );
  });

  it("標籤一律在圓點上方（DOM 順序 label → dot）", () => {
    render(<HotspotLayer zoneId="dino" />);
    const pin = screen.getByLabelText("打開故事屋入口");
    expect(pin.getAttribute("data-label")).toBe("above");
    const children = [...pin.children] as HTMLElement[];
    expect(children[0]?.textContent).toBe("故事屋入口");
    expect(children[1]?.getAttribute("aria-hidden")).toBe("true");
  });

  it("泡泡進場錯開 delay；paused 時層標記 data-paused", () => {
    const { container, rerender } = render(<HotspotLayer zoneId="dino" />);
    const first = screen.getByLabelText("打開故事屋入口");
    const second = screen.getByLabelText("打開笑話廣場");
    expect(first.style.getPropertyValue("--bubble-delay")).toBe("0ms");
    expect(second.style.getPropertyValue("--bubble-delay")).toBe("70ms");

    rerender(<HotspotLayer zoneId="dino" paused />);
    expect(
      (container.firstElementChild as HTMLElement).hasAttribute("data-paused"),
    ).toBe(true);
  });
});

describe("HotspotLayer.module.css 動效契約", () => {
  const css = readFileSync(
    join(import.meta.dirname, "HotspotLayer.module.css"),
    "utf8",
  );

  it("泡泡／呼吸僅 transform／opacity，並有 reduced-motion 與 paused", () => {
    expect(css).toMatch(/hotspot-bubble-rise/);
    expect(css).toMatch(/hotspot-dot-float/);
    expect(css).toMatch(/hotspot-glow-breathe/);
    expect(css).toMatch(/prefers-reduced-motion:\s*reduce/);
    expect(css).toMatch(/\[data-paused\]/);
    // 禁止 layout 觸發屬性進 keyframes
    const keyframes = css.match(/@keyframes[\s\S]*?(?=@keyframes|@media|$)/g) ?? [];
    for (const block of keyframes) {
      expect(block).not.toMatch(
        /\b(width|height|top|left|margin|padding)\s*:/,
      );
    }
  });
});
