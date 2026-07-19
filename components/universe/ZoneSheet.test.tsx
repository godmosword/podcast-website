// @vitest-environment jsdom
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ZONES } from "@/data/universe-zones";
import type { ZoneStoriesBundle } from "@/lib/story-zone-query";
import ZoneSheet from "./ZoneSheet";

vi.stubGlobal("React", React);

afterEach(() => {
  cleanup();
});

const zoneStoriesFixture: ZoneStoriesBundle = {
  previews: [
    { slug: "dino-01", ep: 1, title: "恐龍島的第一天", emoji: "🦕" },
    { slug: "dino-02", ep: 2, title: "恐龍島的大冒險", emoji: "🦖" },
  ],
  total: 2,
  slugs: ["dino-01", "dino-02"],
};

describe("ZoneSheet", () => {
  it("兒童首屏極簡：不含 teaser／exploreNote／進度／softLinks，家長內容預設收合", () => {
    const zone = ZONES.find((item) => item.id === "dino")!;
    const html = renderToStaticMarkup(
      <ZoneSheet zone={zone} onClose={() => undefined} />,
    );

    expect(html).toContain("恐龍島");
    expect(html).toContain("建造中");
    expect(html).not.toContain("恐龍園區探險故事");
    expect(html).not.toContain("恐龍島還在蓋");
    expect(html).not.toContain("建造進度");
    expect(html).not.toContain("回故事屋");
    expect(html).not.toContain("載入中");
    expect(html).not.toContain("暱稱或 Email");
    expect(html).not.toContain("之後開放投票");
    expect(html).toContain("給爸爸媽媽");
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain("無廣告");
    expect(html).not.toContain("想留一句話");
  });

  it("展開「給爸爸媽媽」後顯示 exploreNote、建造進度與 softLinks", () => {
    const zone = ZONES.find((item) => item.id === "dino")!;
    render(<ZoneSheet zone={zone} onClose={() => undefined} />);

    fireEvent.click(screen.getByRole("button", { name: "給爸爸媽媽" }));

    expect(screen.getByText("恐龍島還在蓋，現在可以先聽車車故事，之後再回來逛。")).toBeTruthy();
    expect(screen.getByLabelText("建造進度")).toBeTruthy();
    expect(screen.getByText("建造進度 60%")).toBeTruthy();
    expect(screen.getByRole("link", { name: "回故事屋" })).toBeTruthy();
    expect(screen.getByText("想留一句話")).toBeTruthy();
  });

  it("dialog 容器帶 tabindex=-1 供初始焦點（避免開啟瞬間 ✕ 出現 focus ring）", () => {
    const zone = ZONES.find((item) => item.id === "dino")!;
    const html = renderToStaticMarkup(
      <ZoneSheet zone={zone} onClose={() => undefined} />,
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('tabindex="-1"');
  });

  it("故事清單改為大圖卡：顯示 EP 字樣、標題與 emoji，已聽完集數帶星星徽章", () => {
    const zone = ZONES.find((item) => item.id === "dino")!;
    const html = renderToStaticMarkup(
      <ZoneSheet
        zone={zone}
        onClose={() => undefined}
        zoneStories={zoneStoriesFixture}
        completedSlugs={new Set(["dino-01"])}
      />,
    );

    expect(html).toContain("EP 1");
    expect(html).toContain("恐龍島的第一天");
    expect(html).toContain("EP 2");
    expect(html).toContain("恐龍島的大冒險");
    expect(html).toContain("🦕");
    expect(html).toContain('href="/story/dino-01"');
    expect(html).toContain('href="/story/dino-02"');
    expect(html).toContain('aria-label="已聽完"');
  });

  it("car-park（開放島）無故事預覽時主 CTA 首屏可見，其餘入口收進「給爸爸媽媽」", () => {
    const zone = ZONES.find((item) => item.id === "car-park")!;
    const html = renderToStaticMarkup(
      <ZoneSheet zone={zone} onClose={() => undefined} />,
    );

    expect(html).toContain('href="/stories"');
    expect(html).toContain("全部故事");
    expect(html).toContain("給爸爸媽媽");
    expect(html).not.toContain("故事 · 睡前 · 黏土 · 安全");
  });
});
