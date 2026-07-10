import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ZONES } from "@/data/universe-zones";
import type { ZoneStoriesBundle } from "@/lib/story-zone-query";
import ZoneSheet from "./ZoneSheet";

vi.stubGlobal("React", React);

const zoneStoriesFixture: ZoneStoriesBundle = {
  previews: [
    { slug: "dino-01", ep: 1, title: "恐龍島的第一天", emoji: "🦕" },
    { slug: "dino-02", ep: 2, title: "恐龍島的大冒險", emoji: "🦖" },
  ],
  total: 2,
  slugs: ["dino-01", "dino-02"],
};

describe("ZoneSheet", () => {
  it("shows an open-ended exploration note, but keeps parent-only content collapsed", () => {
    const zone = ZONES.find((item) => item.id === "dino")!;
    const html = renderToStaticMarkup(
      <ZoneSheet zone={zone} onClose={() => undefined} />,
    );

    expect(html).toContain("恐龍島還在蓋");
    expect(html).not.toContain("載入中");
    expect(html).not.toContain("暱稱或 Email");
    expect(html).not.toContain("之後開放投票");
  });

  it('收合「給爸爸媽媽」disclosure 預設關閉，首屏不含無廣告安心資訊與許願表單', () => {
    const zone = ZONES.find((item) => item.id === "dino")!;
    const html = renderToStaticMarkup(
      <ZoneSheet zone={zone} onClose={() => undefined} />,
    );

    expect(html).toContain("給爸爸媽媽");
    expect(html).toContain('aria-expanded="false"');
    // 家長專屬內容收在收合的 disclosure 面板內，未展開時不應出現在首屏 markup
    expect(html).not.toContain("無廣告");
    expect(html).not.toContain("想留一句話");
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

  it("car-park（開放島）主要故事入口維持首屏可見，其餘入口收進「給爸爸媽媽」disclosure", () => {
    const zone = ZONES.find((item) => item.id === "car-park")!;
    const html = renderToStaticMarkup(
      <ZoneSheet zone={zone} onClose={() => undefined} />,
    );

    expect(html).toContain('href="/stories"');
    expect(html).toContain("給爸爸媽媽");
  });
});
