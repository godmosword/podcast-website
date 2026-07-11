import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";
import { resolveLandingSegments } from "@/lib/landing-query";

vi.stubGlobal("React", React);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("./LandingScrollContext", () => ({
  useLandingScroll: () => null,
}));

describe("LandingSegment", () => {
  test("首段 Hero 顯示訂閱收聽連至 #connect（Growth-P1b）", async () => {
    const { default: LandingSegment } = await import("./LandingSegment");
    const segment = resolveLandingSegments()[0]!;
    const html = renderToStaticMarkup(
      <LandingSegment
        segment={segment}
        index={0}
        total={4}
        nextAnchorId="segment-bedtime"
      />,
    );
    expect(html).toContain('href="#connect"');
    expect(html).toContain("訂閱收聽");
  });

  test("首段顯示播放直達鈕（聽最新一集）與副標", async () => {
    const { default: LandingSegment } = await import("./LandingSegment");
    const segment = resolveLandingSegments()[0]!;
    const html = renderToStaticMarkup(
      <LandingSegment
        segment={segment}
        index={0}
        total={4}
        nextAnchorId="segment-bedtime"
      />,
    );
    expect(html).toContain("聽最新一集");
    expect(html).toMatch(/href="\/story\/[^"]+\/play\?autoplay=1&amp;from=landing"/);
    expect(html).toContain("親子 podcast");
  });

  test("睡前段顯示播一集睡前故事直達鈕", async () => {
    const { default: LandingSegment } = await import("./LandingSegment");
    const segment = resolveLandingSegments()[1]!;
    const html = renderToStaticMarkup(
      <LandingSegment
        segment={segment}
        index={1}
        total={4}
        nextAnchorId="segment-clay"
      />,
    );
    expect(html).toContain("播一集睡前故事");
    expect(html).toMatch(/href="\/story\/[^"]+\/play\?autoplay=1&amp;from=landing"/);
  });

  test("非首段不顯示訂閱收聽捷徑", async () => {
    const { default: LandingSegment } = await import("./LandingSegment");
    const segment = resolveLandingSegments()[1]!;
    const html = renderToStaticMarkup(
      <LandingSegment
        segment={segment}
        index={1}
        total={4}
        nextAnchorId="segment-clay"
      />,
    );
    expect(html).not.toContain('href="#connect"');
  });
});
