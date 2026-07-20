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
  test("首段 Hero 不重複顯示訂閱收聽入口", async () => {
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
    expect(html).not.toContain('href="#connect"');
    expect(html).not.toContain("訂閱收聽");
  });

  test("首段顯示播放直達鈕與網站導言", async () => {
    const { default: LandingSegment } = await import("./LandingSegment");
    const { homeSiteIntro } = await import("@/lib/home-geo");
    const segment = resolveLandingSegments()[0]!;
    const intro = homeSiteIntro();
    const html = renderToStaticMarkup(
      <LandingSegment
        segment={segment}
        index={0}
        total={4}
        siteIntro={intro}
        nextAnchorId="segment-bedtime"
      />,
    );
    expect(html).toContain("聽最新一集");
    expect(html).toMatch(/href="\/story\/[^"]+\/play\?autoplay=1&amp;from=landing"/);
    expect(html).toContain(intro);
    expect(html).toContain("5–10 分鐘");
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

});
