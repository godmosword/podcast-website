import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";
import type { Story } from "@/data/content";

vi.stubGlobal("React", React);

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    style,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
  }) => (
    <a href={href} className={className} style={style}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    sizes,
    className,
  }: {
    src: string;
    alt: string;
    sizes?: string;
    className?: string;
  }) => (
    // StoryImage 經 next/image；測 sizes 是否傳到 img
    // eslint-disable-next-line @next/next/no-img-element -- 測試 mock，非 runtime
    <img src={src} alt={alt} sizes={sizes} className={className} />
  ),
}));

vi.mock("@/components/story/StoryProgressBadge", () => ({
  default: () => null,
}));

const listStory: Story = {
  kind: "story",
  slug: "ep-1",
  title: "測試故事",
  date: "2026-01-01",
  emoji: "🚗",
  color: "#ff8866",
  ep: 1,
  vehicle: "消防車",
  audio: "/audio/ep-1.mp3",
  pageCount: 8,
};

describe("StoryCard", () => {
  test("列表 variant 的封面 sizes 對齊 96px 縮圖", async () => {
    const { default: StoryCard } = await import("./StoryCard");

    const html = renderToStaticMarkup(<StoryCard story={listStory} />);

    expect(html).toContain('sizes="(max-width: 480px) 80px, 96px"');
    expect(html).not.toContain("46vw");
  });

  test("目錄卡用較大的桌機 sizes，且不靠 grid variant class", async () => {
    const { default: StoryCard } = await import("./StoryCard");
    const { STORIES_CATALOG_COVER_SIZES } = await import("@/lib/stories-view");

    const html = renderToStaticMarkup(
      <StoryCard story={listStory} catalog />,
    );

    expect(html).toContain(`sizes="${STORIES_CATALOG_COVER_SIZES}"`);
    expect(html).not.toContain("cardGrid");
  });
});
