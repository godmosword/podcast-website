import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";
import type { Story } from "@/data/content";
import { StoryFilter } from "./StoryFilter";

vi.stubGlobal("React", React);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/stories",
  useSearchParams: () => new URLSearchParams(""),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element -- 測試 mock
    <img alt={alt} />
  ),
}));

vi.mock("@/components/story/StoryProgressBadge", () => ({
  default: () => null,
}));

function story(slug: string, vehicle: string, tags: string[] = []): Story {
  return {
    kind: "story",
    slug,
    title: slug,
    date: "2026-06-16",
    emoji: "🚗",
    color: "#339af0",
    ep: Number(slug.replace("ep-", "")),
    vehicle,
    audio: "audio.mp3",
    pageCount: 1,
    tags,
  };
}

const stories = [
  story("ep-12", "警車", ["合作"]),
  story("ep-11", "賽車", ["勇氣"]),
];

describe("StoryFilter", () => {
  test("依 URL 對應的 vehicle 只列出符合的故事", () => {
    const html = renderToStaticMarkup(
      <StoryFilter
        stories={stories}
        vehicles={["警車", "賽車"]}
        tags={["合作", "勇氣"]}
        featuredStorySlug="ep-12"
        vehicle="警車"
        tag={null}
        query=""
      />,
    );
    expect(html).toContain("ep-12");
    expect(html).not.toContain("ep-11");
    expect(html).toContain("1 則故事");
  });

  test("q 搜尋顯示目前關鍵字", () => {
    const html = renderToStaticMarkup(
      <StoryFilter
        stories={stories}
        vehicles={["警車", "賽車"]}
        tags={["合作", "勇氣"]}
        featuredStorySlug="ep-12"
        vehicle={null}
        tag={null}
        query="賽車"
      />,
    );
    expect(html).toContain("搜尋「賽車」");
    expect(html).toContain("ep-11");
  });

  test("找故事下拉不另放車車／主題副標", () => {
    const html = renderToStaticMarkup(
      <StoryFilter
        stories={stories}
        vehicles={["警車", "賽車"]}
        tags={["合作", "勇氣"]}
        featuredStorySlug="ep-12"
        vehicle={null}
        tag={null}
        query=""
      />,
    );
    expect(html).toContain("找故事");
    expect(html).toContain('aria-label="選擇車車"');
    expect(html).toContain('aria-label="選擇主題"');
    expect(html).not.toContain("filter-vehicle-label");
    expect(html).not.toContain("filter-topic-label");
    expect(html).not.toMatch(/fieldLabel|>車車<|>主題</);
  });
});
