import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { allTags, allVehicles, getStoriesByTag, getStoriesByVehicle, storiesByNewest } from "@/data/content";
import { StoriesIndexHeader } from "@/components/stories/StoriesIndexHeader";
import { GeoSrOnlyLede } from "@/lib/geo-sr-only-lede";
import { storiesCatalogSummary } from "@/lib/stories-geo";
import { topicIndexDefinitionSummary } from "@/lib/topic-index-geo";
import { topicDefinitionSummary } from "@/lib/topic-geo";
import { vehicleDefinitionSummary } from "@/lib/vehicle-geo";

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

vi.mock("@/components/landing/LandingScrollContext", () => ({
  useLandingScroll: () => null,
}));

function srOnlyParagraphHtml(text: string): string {
  return renderToStaticMarkup(<GeoSrOnlyLede>{text}</GeoSrOnlyLede>);
}

/** 確認 sr-only 段落與完整原文在同一 `<p>` 內（避免只靠 meta／片段假通過）。 */
function expectSingleSrOnlyParagraph(html: string, text: string): void {
  expect(html).toMatch(
    new RegExp(
      `<p class="sr-only">${escapeRegExp(text)}</p>`,
    ),
  );
  expect(html.match(/class="sr-only"/g)?.length).toBe(1);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

describe("GeoSrOnlyLede", () => {
  it("輸出單一 sr-only 段落且含完整 summary", () => {
    const stories = storiesByNewest();
    const summary = storiesCatalogSummary(
      stories,
      allTags().length,
      allVehicles().length,
    );
    const html = srOnlyParagraphHtml(summary);
    expectSingleSrOnlyParagraph(html, summary);
  });

  it("主題索引 summary 契約", () => {
    const themes = allTags().map((tag) => ({
      tag,
      count: getStoriesByTag(tag).length,
    }));
    const summary = topicIndexDefinitionSummary(themes);
    expectSingleSrOnlyParagraph(srOnlyParagraphHtml(summary), summary);
  });

  it("主題聚合 summary 契約", () => {
    const tag = allTags()[0]!;
    const stories = getStoriesByTag(tag);
    const summary = topicDefinitionSummary(tag, stories);
    expectSingleSrOnlyParagraph(srOnlyParagraphHtml(summary), summary);
  });

  it("車種聚合 summary 契約", () => {
    const vehicle = allVehicles()[0]!;
    const stories = getStoriesByVehicle(vehicle);
    const summary = vehicleDefinitionSummary(vehicle, stories);
    expectSingleSrOnlyParagraph(srOnlyParagraphHtml(summary), summary);
  });
});

describe("StoriesIndexHeader", () => {
  it("可見 h1 全部故事 + sr-only catalog 導言", () => {
    const stories = storiesByNewest();
    const lede = storiesCatalogSummary(
      stories,
      allTags().length,
      allVehicles().length,
    );
    const html = renderToStaticMarkup(
      <StoriesIndexHeader lede={lede} titleClassName="storiesTitle" />,
    );
    expect(html).toContain('<h1 class="storiesTitle">全部故事</h1>');
    expectSingleSrOnlyParagraph(html, lede);
  });
});

describe("首頁 siteIntro sr-only 同元素契約", () => {
  it("LandingSegment 首段 siteIntro 在 sr-only 段落內", async () => {
    const { default: LandingSegment } = await import(
      "@/components/landing/LandingSegment"
    );
    const { homeSiteIntro } = await import("@/lib/home-geo");
    const { resolveLandingSegments } = await import("@/lib/landing-query");
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
    expectSingleSrOnlyParagraph(html, intro);
  });
});
