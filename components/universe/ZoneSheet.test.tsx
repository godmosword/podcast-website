// @vitest-environment jsdom
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { zoneById } from "@/data/universe";
import { ZONES } from "@/data/universe-zones";
import { getCarParkLinks } from "@/lib/universe-map";
import type { ZoneStoriesBundle } from "@/lib/story-zone-query";
import ZoneSheet from "./ZoneSheet";

vi.stubGlobal("React", React);

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
  Element.prototype.scrollIntoView = vi.fn();
});

const sheetProps = {
  expanded: true,
  onExpand: () => undefined,
  onCollapse: () => undefined,
};

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
  it("收合時只顯示召喚把手「來這裡逛逛」", () => {
    const zone = ZONES.find((item) => item.id === "dino")!;
    const { container } = render(
      <ZoneSheet
        zone={zone}
        expanded={false}
        onExpand={() => undefined}
        onCollapse={() => undefined}
      />,
    );

    expect(screen.getByRole("button", { name: "來這裡逛逛" })).toBeTruthy();
    expect(screen.queryByRole("region")).toBeNull();
    expect(container.querySelector('[aria-hidden="true"]')?.textContent).toContain(
      "👋",
    );
    // 收合態不掛 scrim class（印刷地圖不被壓暗）
    expect(container.firstElementChild?.className ?? "").not.toMatch(
      /overlayScrim/,
    );
    // panel 未掛載時不宣稱 aria-controls（避免指向幽靈 id）
    expect(
      screen.getByRole("button", { name: "來這裡逛逛" }).getAttribute(
        "aria-controls",
      ),
    ).toBeNull();
  });

  it("展開後焦點落在面板 region，且無重複 h1", () => {
    const zone = ZONES.find((item) => item.id === "dino")!;
    render(<ZoneSheet zone={zone} {...sheetProps} />);

    const region = screen.getByRole("region", { name: zone.name });
    expect(document.activeElement).toBe(region);
    expect(region.querySelectorAll("h1")).toHaveLength(0);
  });

  it("展開時掛 overlayScrim；收合無 scrim", () => {
    const zone = ZONES.find((item) => item.id === "dino")!;
    const { container, rerender } = render(
      <ZoneSheet zone={zone} {...sheetProps} />,
    );
    expect(container.firstElementChild?.className ?? "").toMatch(/overlayScrim/);

    rerender(
      <ZoneSheet
        zone={zone}
        expanded={false}
        onExpand={() => undefined}
        onCollapse={() => undefined}
      />,
    );
    expect(container.firstElementChild?.className ?? "").not.toMatch(
      /overlayScrim/,
    );
  });

  it("鎖島首屏少字更視覺化：留 childHint／進度／CTA／softLinks 在次層，整句說明移入折疊", () => {
    const zone = ZONES.find((item) => item.id === "dino")!;
    const html = renderToStaticMarkup(
      <ZoneSheet zone={zone} {...sheetProps} />,
    );

    expect(html).toContain("恐龍島在長大");
    expect(html).toContain("去聽車車故事");
    expect(html).toContain('href="/stories"');
    expect(html).not.toContain("建造進度");
    expect(html).toContain("看看這座島有什麼");
    expect(html).not.toContain("敬請期待");
    expect(html).not.toContain("恐龍島還在蓋，現在可以先聽車車故事，之後再回來逛。");
    expect(html).toContain("給爸爸媽媽");
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain("無廣告");
    expect(html).not.toContain("想留一句話");
    expect(html).not.toContain("回樂園");
    expect(html).not.toContain('role="dialog"');
    expect(html).toContain('role="region"');
    expect(html).toContain(`aria-label="${zone.name}"`);
    expect(html).not.toContain("<h1");
  });

  it("展開「給爸爸媽媽」後顯示整句說明、安心資訊與「想留一句話」許願表單", () => {
    const zone = ZONES.find((item) => item.id === "dino")!;
    render(<ZoneSheet zone={zone} {...sheetProps} />);

    fireEvent.click(screen.getByRole("button", { name: "給爸爸媽媽" }));

    expect(
      screen.getByText("恐龍島還在蓋，現在可以先聽車車故事，之後再回來逛。"),
    ).toBeTruthy();
    expect(screen.getByText(/無廣告/)).toBeTruthy();
    expect(screen.getByText("想留一句話")).toBeTruthy();
  });

  it("故事清單改為大圖卡：顯示 EP 字樣、標題與 emoji，第一集標「最新」，已聽完帶星星徽章", () => {
    const zone = ZONES.find((item) => item.id === "dino")!;
    const html = renderToStaticMarkup(
      <ZoneSheet
        zone={zone}
        {...sheetProps}
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

  it("鎖島有 zoneStories 時 CTA 在 stories 區塊 DOM 之後（首屏故事卡優先）", () => {
    const zone = ZONES.find((item) => item.id === "dino")!;
    const { container } = render(
      <ZoneSheet
        zone={zone}
        {...sheetProps}
        zoneStories={zoneStoriesFixture}
      />,
    );

    const cta = screen.getByRole("link", { name: "去聽車車故事" });
    const storyLink = screen.getByRole("link", { name: /EP 1/ });
    const ctaIndex = Array.from(container.querySelectorAll("a, section")).indexOf(
      cta,
    );
    const storiesIndex = Array.from(
      container.querySelectorAll("a, section"),
    ).indexOf(storyLink.closest("section")!);
    expect(ctaIndex).toBeGreaterThan(storiesIndex);
  });

  it("car-park 四段內容支柱收在「看看這座島有什麼」次層，首屏不出現", () => {
    const zone = ZONES.find((item) => item.id === "car-park")!;
    const html = renderToStaticMarkup(
      <ZoneSheet zone={zone} {...sheetProps} />,
    );

    for (const link of getCarParkLinks()) {
      expect(html).not.toContain(link.label);
    }
    expect(html).toContain("看看這座島有什麼");
    expect(html).toContain("給爸爸媽媽");
    expect(html).not.toContain("想留一句話");
  });

  it("car-park 黏土外連展開後 aria-label 告知另開 YouTube，內部連結不含", () => {
    const zone = ZONES.find((item) => item.id === "car-park")!;
    render(<ZoneSheet zone={zone} {...sheetProps} />);

    fireEvent.click(
      screen.getByRole("button", { name: "看看這座島有什麼" }),
    );

    const clayLink = screen.getByRole("link", {
      name: "捏黏土（另開 YouTube）",
    });
    expect(clayLink).toBeTruthy();
    expect(clayLink.textContent).toContain("捏黏土");

    for (const link of getCarParkLinks()) {
      if (link.external) continue;
      const internalLink = screen.getByRole("link", { name: link.label });
      expect(internalLink.getAttribute("aria-label") ?? "").not.toMatch(
        /另開 YouTube/,
      );
    }
  });

  it("展開「看看這座島有什麼」後列出全部地點，且精選地標優先排列", () => {
    const zone = ZONES.find((item) => item.id === "dino")!;
    const source = zoneById("dino")!;
    render(
      <ZoneSheet
        zone={zone}
        {...sheetProps}
        hotspots={source.hotspots}
      />,
    );

    expect(screen.queryByText(/共 9 個地點/)).toBeNull();

    fireEvent.click(
      screen.getByRole("button", { name: "看看這座島有什麼" }),
    );

    expect(screen.getByText(/共 9 個地點/)).toBeTruthy();
    for (const hotspot of source.hotspots) {
      expect(screen.getByText(hotspot.name)).toBeTruthy();
    }
    const html = document.body.innerHTML;
    expect(html.indexOf("故事屋入口")).toBeLessThan(html.indexOf("阿酷隧道"));
    expect(html).toContain('data-featured="true"');
  });
});
