import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";
import { resolveLandingSegments } from "@/lib/landing-query";

vi.stubGlobal("React", React);

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
      <LandingSegment segment={segment} index={0} nextAnchorId="segment-bedtime" />,
    );
    expect(html).toContain('href="#connect"');
    expect(html).toContain("訂閱收聽");
  });

  test("非首段不顯示訂閱收聽捷徑", async () => {
    const { default: LandingSegment } = await import("./LandingSegment");
    const segment = resolveLandingSegments()[1]!;
    const html = renderToStaticMarkup(
      <LandingSegment
        segment={segment}
        index={1}
        nextAnchorId="segment-clay"
      />,
    );
    expect(html).not.toContain('href="#connect"');
  });
});
