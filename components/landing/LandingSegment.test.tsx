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

  test("首段顯示網站導言，不顯示播放直達鈕", async () => {
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
    expect(html).not.toContain("聽最新一集");
    expect(html).not.toMatch(/\/play\?autoplay=1/);
    expect(html).toContain("全部故事");
    expect(html).toContain("車車與遊樂園的故事");
    expect(html).toContain(intro);
    expect(html).toMatch(
      new RegExp(
        `<p class="sr-only">[\\s\\S]*${intro.slice(0, 24).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*</p>`,
      ),
    );
    expect(html).not.toContain("5–10 分鐘");
  });

  test("四段都不渲染播放直達，段標題視覺隱藏", async () => {
    const { default: LandingSegment } = await import("./LandingSegment");
    const segments = resolveLandingSegments();
    for (const [index, segment] of segments.entries()) {
      const html = renderToStaticMarkup(
        <LandingSegment
          segment={segment}
          index={index}
          total={4}
          nextAnchorId="segment-clay"
        />,
      );
      expect(html).not.toContain("聽最新一集");
      expect(html).not.toContain("播一集睡前故事");
      expect(html).not.toMatch(/\/play\?autoplay=1/);
      expect(html).toContain(`id="${segment.anchorId}-title"`);
      expect(html).toMatch(/titleHidden/);
    }
  });

});
