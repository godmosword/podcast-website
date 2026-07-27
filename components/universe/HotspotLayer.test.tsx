// @vitest-environment jsdom
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

  it("島下半部的標籤翻到圓點上方（避開木牌與彼此重疊）", () => {
    render(<HotspotLayer zoneId="dino" />);
    // story-house pos.y = 0.72 → 翻上；soft-truck pos.y = 0.32 → 維持下方
    expect(
      screen.getByLabelText("打開故事屋入口").getAttribute("data-flip"),
    ).toBe("up");
    expect(
      screen.getByLabelText("打開輕輕停車格").getAttribute("data-flip"),
    ).toBeNull();
  });
});
