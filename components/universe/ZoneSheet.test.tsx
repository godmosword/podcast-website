// @vitest-environment jsdom
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ZONES } from "@/data/universe-zones";
import { getCarParkLinks } from "@/lib/universe-map";
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
  it("鎖島首屏少字更視覺化：留 childHint／進度／CTA／softLinks，整句說明移入折疊", () => {
    const zone = ZONES.find((item) => item.id === "dino")!;
    const html = renderToStaticMarkup(
      <ZoneSheet zone={zone} onClose={() => undefined} />,
    );

    // 首屏可見：狀態、childHint（短句）、主 CTA、建造進度、softLinks
    expect(html).toContain("恐龍島");
    expect(html).toContain("建造中");
    expect(html).toContain("恐龍島在長大");
    expect(html).toContain("去聽車車故事");
    expect(html).toContain('href="/stories"');
    expect(html).toContain("建造進度 60%");
    expect(html).toContain("回故事屋");
    // teaser 不入卡
    expect(html).not.toContain("恐龍園區探險故事");
    // 整句說明（exploreNote）移入「給爸爸媽媽」折疊、首屏不出現
    expect(html).not.toContain("恐龍島還在蓋，現在可以先聽車車故事，之後再回來逛。");
    // 家長專區仍為單層折疊、預設收合
    expect(html).toContain("給爸爸媽媽");
    expect(html).toContain('aria-expanded="false"');
    // 收合時家長內容（安心資訊、許願）不出現在首屏
    expect(html).not.toContain("無廣告");
    expect(html).not.toContain("想留一句話");
    expect(html).not.toContain("暱稱或 Email");
  });

  it("展開「給爸爸媽媽」後顯示整句說明、安心資訊與「想留一句話」許願表單", () => {
    const zone = ZONES.find((item) => item.id === "dino")!;
    render(<ZoneSheet zone={zone} onClose={() => undefined} />);

    fireEvent.click(screen.getByRole("button", { name: "給爸爸媽媽" }));

    expect(
      screen.getByText("恐龍島還在蓋，現在可以先聽車車故事，之後再回來逛。"),
    ).toBeTruthy();
    expect(screen.getByText(/無廣告/)).toBeTruthy();
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

  it("故事清單改為大圖卡：顯示 EP 字樣、標題與 emoji，第一集標「最新」，已聽完帶星星徽章", () => {
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
    expect(html).toContain("最新");
    expect(html).toContain('href="/story/dino-01"');
    expect(html).toContain('href="/story/dino-02"');
    expect(html).toContain('aria-label="已聽完"');
  });

  it("鎖島有 zoneStories 時 CTA 在 stories 區塊 DOM 之前", () => {
    const zone = ZONES.find((item) => item.id === "dino")!;
    const { container } = render(
      <ZoneSheet
        zone={zone}
        onClose={() => undefined}
        zoneStories={zoneStoriesFixture}
      />,
    );

    const cta = screen.getByRole("link", { name: "去聽車車故事" });
    const storiesHeading = screen.getByRole("heading", {
      name: "這座島已經有的故事",
    });
    const ctaIndex = Array.from(container.querySelectorAll("a, section")).indexOf(
      cta,
    );
    const storiesIndex = Array.from(
      container.querySelectorAll("a, section"),
    ).indexOf(storiesHeading.closest("section")!);
    expect(ctaIndex).toBeGreaterThanOrEqual(0);
    expect(storiesIndex).toBeGreaterThan(ctaIndex);
  });

  it("car-park（開放島）四段內容支柱前置、平權可見，不再藏進「給爸爸媽媽」", () => {
    const zone = ZONES.find((item) => item.id === "car-park")!;
    const html = renderToStaticMarkup(
      <ZoneSheet zone={zone} onClose={() => undefined} />,
    );

    // 四段 CTA 全部在首屏可見（label 來自 LANDING_SEGMENTS，單一資料源）
    for (const link of getCarParkLinks()) {
      expect(html).toContain(link.label);
      expect(html).toContain(`href="${link.href}"`);
    }
    // 家長專區仍在，但主導覽不再被折疊
    expect(html).toContain("給爸爸媽媽");
    expect(html).toContain('aria-expanded="false"');
    // 開放島無許願表單
    expect(html).not.toContain("想留一句話");
  });
});
