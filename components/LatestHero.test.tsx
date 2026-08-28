import { readFileSync } from "node:fs";
import { join } from "node:path";
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

vi.mock("./StoryImage", () => ({
  default: ({ priority }: { priority?: boolean }) => (
    <span data-priority={priority ? "high" : "auto"} />
  ),
}));

const story: Story = {
  kind: "story",
  slug: "ep-26",
  title: "測試最新集",
  date: "2026-08-01",
  emoji: "🚗",
  color: "#7c5cbf",
  ep: 26,
  vehicle: "其他",
  audio: "/audio/ep-26.mp3",
  pageCount: 1,
};

describe("LatestHero", () => {
  test("封面不設 priority，避免與 SiteHeader hero 搶 preload", async () => {
    const { default: LatestHero } = await import("./LatestHero");
    const html = renderToStaticMarkup(<LatestHero story={story} />);
    expect(html).toContain('data-priority="auto"');
    expect(html).not.toContain('data-priority="high"');
  });
});

describe("LatestHero.module.css 摘要 clamp 契約", () => {
  const css = readFileSync(
    join(import.meta.dirname, "LatestHero.module.css"),
    "utf8",
  );

  test(".summary 三行 clamp 三件齊全", () => {
    expect(css).toMatch(/display:\s*-webkit-box/);
    expect(css).toMatch(/-webkit-line-clamp:\s*3|line-clamp:\s*3/);
    expect(css).toMatch(/overflow:\s*hidden/);
  });
});
