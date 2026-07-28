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
    expect(prefetch).toHaveBeenCalled();
    expect(prefetch.mock.calls.flat()).toContain(
      "/adventures/dino/story-house",
    );
    expect(screen.queryByLabelText("恐龍巢穴（尚未開放）")).toBeNull();
  });

  it("其他島（海洋）也渲染 M3 熱點", () => {
    render(<HotspotLayer zoneId="ocean" />);
    expect(
      screen.getByLabelText("打開水上樂園門口").getAttribute("href"),
    ).toBe("/adventures/ocean/wave-park");
    expect(screen.queryByLabelText("夢想碼頭（尚未開放）")).toBeNull();
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

  it("精選點渲染為常駐地標牌與接地標記", () => {
    render(<HotspotLayer zoneId="dino" />);
    const pin = screen.getByLabelText("打開故事屋入口");
    expect(pin.getAttribute("data-featured")).toBe("true");
    expect(pin.querySelector('[aria-hidden="true"]')?.textContent).toContain(
      "故事屋入口",
    );
    expect(pin.querySelector('[class*="signStem"]')).toBeTruthy();
    expect(pin.querySelector('[class*="signBase"]')).toBeTruthy();
  });

  it("探索點只呈現精選三點；paused 時層標記 data-paused", () => {
    const { container, rerender } = render(<HotspotLayer zoneId="dino" />);
    expect(container.querySelectorAll('[data-featured="true"]')).toHaveLength(3);
    expect(screen.queryByLabelText("打開阿酷隧道")).toBeNull();

    rerender(<HotspotLayer zoneId="dino" paused />);
    expect(
      (container.firstElementChild as HTMLElement).hasAttribute("data-paused"),
    ).toBe(true);
  });
});

describe("HotspotLayer.module.css 視覺契約", () => {
  const css = readFileSync(
    join(import.meta.dirname, "HotspotLayer.module.css"),
    "utf8",
  );

  it("地標牌包含牌面／旗桿／底座，並支援 reduced-motion", () => {
    expect(css).toMatch(/\.signPlate/);
    expect(css).toMatch(/\.signStem/);
    expect(css).toMatch(/\.signBase/);
    expect(css).toMatch(/\.pin\[data-kind="story"\]/);
    expect(css).toMatch(/\.pin\[data-kind="link"\]/);
    expect(css).toMatch(/prefers-reduced-motion:\s*reduce/);
  });

  it("探索點帶有動作種類標記，供安靜標記層分色", () => {
    render(<HotspotLayer zoneId="dino" />);

    expect(screen.getByLabelText("打開故事屋入口").getAttribute("data-kind")).toBe(
      "link",
    );
    expect(screen.getByLabelText("打開笑話廣場").getAttribute("data-kind")).toBe(
      "story",
    );
    cleanup();
    render(<HotspotLayer zoneId="forest" />);
    expect(screen.getByLabelText("樹屋（尚未開放）").getAttribute("data-kind")).toBe(
      "locked",
    );
  });
});
