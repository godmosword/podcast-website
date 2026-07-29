import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { mapDepthZ } from "@/lib/universe-depth";
import { resolveUniverseMap } from "@/lib/universe-map";
import ZoneIsland from "./ZoneIsland";

vi.stubGlobal("React", React);

describe("ZoneIsland", () => {
  it("puts the island body and readable label into separate depth bands", () => {
    const zone = resolveUniverseMap().zones.find((z) => z.id === "car-park")!;
    const html = renderToStaticMarkup(
      <ZoneIsland
        zone={zone}
        onActivate={() => undefined}
        reduced
        paused={false}
        night={false}
      />,
    );

    expect(html).toContain(`z-index:${mapDepthZ(zone.depthY, "island")}`);
    expect(html).toContain(`z-index:${mapDepthZ(zone.depthY, "label")}`);
  });

  it("island tile 輸出 srcSet；木牌反縮放吃 CSS --map-scale", () => {
    const zone = resolveUniverseMap().zones.find((z) => z.id === "car-park")!;
    const html = renderToStaticMarkup(
      <ZoneIsland
        zone={zone}
        onActivate={() => undefined}
        mapScale={2}
        reduced
        paused={false}
        night={false}
      />,
    );

    expect(html).toContain("264w");
    expect(html).toContain("528w");
    expect(html).toContain("792w");
    // 反縮放改由 CSS module（--map-scale），不再內聯 scale(1/mapScale)
    expect(html).not.toContain("scale(0.5)");
  });

  it("統一點擊語意：鎖島不再有獨立看看鈕，pill 帶學齡前語意 icon", () => {
    const zone = resolveUniverseMap().zones.find((z) => z.id === "dino")!;
    const html = renderToStaticMarkup(
      <ZoneIsland
        zone={zone}
        onActivate={() => undefined}
        reduced
        paused={false}
        night={false}
      />,
    );

    expect(html).not.toContain("看看");
    expect(html).not.toContain("建造中");
    expect(html).not.toContain("🚧");
  });

  it("鏡頭停在該島時，aria-label 說明再點一次看整片地圖", () => {
    const zone = resolveUniverseMap().zones.find((z) => z.id === "dino")!;
    const idle = renderToStaticMarkup(
      <ZoneIsland
        zone={zone}
        onActivate={() => undefined}
        reduced
        paused={false}
        night={false}
      />,
    );
    const active = renderToStaticMarkup(
      <ZoneIsland
        zone={zone}
        onActivate={() => undefined}
        reduced
        paused={false}
        night={false}
        active
      />,
    );

    expect(idle).not.toContain("再點一次看整片地圖");
    expect(active).toContain("恐龍島，再點一次看整片地圖");
  });

  it("零進度不顯示星章 chip（無 progress 或 completed=0）", () => {
    const zone = resolveUniverseMap().zones.find((z) => z.id === "car-park")!;
    const noProgress = renderToStaticMarkup(
      <ZoneIsland
        zone={zone}
        onActivate={() => undefined}
        reduced
        paused={false}
        night={false}
      />,
    );
    const zeroProgress = renderToStaticMarkup(
      <ZoneIsland
        zone={zone}
        onActivate={() => undefined}
        reduced
        paused={false}
        night={false}
        progress={{ completed: 0, total: 6 }}
      />,
    );

    expect(noProgress).not.toContain("⭐");
    expect(zeroProgress).not.toContain("⭐");
    expect(noProgress).not.toContain("data-progress");
    expect(zeroProgress).not.toContain("data-progress");
  });

  it("有進度時木牌顯示 ⭐ n/N chip（不拆離散空星）", () => {
    const zone = resolveUniverseMap().zones.find((z) => z.id === "car-park")!;
    const html = renderToStaticMarkup(
      <ZoneIsland
        zone={zone}
        onActivate={() => undefined}
        reduced
        paused={false}
        night={false}
        progress={{ completed: 3, total: 6 }}
      />,
    );

    expect(html).toContain("⭐ 3/6");
    expect(html).toContain("data-progress");
  });

  it("有進度時 aria-label 含已聽完集數", () => {
    const zone = resolveUniverseMap().zones.find((z) => z.id === "car-park")!;
    const html = renderToStaticMarkup(
      <ZoneIsland
        zone={zone}
        onActivate={() => undefined}
        reduced
        paused={false}
        night={false}
        progress={{ completed: 2, total: 5 }}
      />,
    );

    expect(html).toContain('aria-label="車車樂園，已聽完 2 集"');
  });

  it("滿星時 chip 帶 data-full-stars、文案仍為 ⭐ n/N", () => {
    const zone = resolveUniverseMap().zones.find((z) => z.id === "car-park")!;
    const html = renderToStaticMarkup(
      <ZoneIsland
        zone={zone}
        onActivate={() => undefined}
        reduced
        paused={false}
        night={false}
        progress={{ completed: 6, total: 6 }}
      />,
    );

    expect(html).toContain("⭐ 6/6");
    expect(html).toContain("data-full-stars");
    expect(html).toContain("progressChipInner");
  });

  it("滿星時 aria-label 含「這座島的故事都聽完了」", () => {
    const zone = resolveUniverseMap().zones.find((z) => z.id === "car-park")!;
    const html = renderToStaticMarkup(
      <ZoneIsland
        zone={zone}
        onActivate={() => undefined}
        reduced
        paused={false}
        night={false}
        progress={{ completed: 5, total: 5 }}
      />,
    );

    expect(html).toContain(
      'aria-label="車車樂園，已聽完 5 集，這座島的故事都聽完了"',
    );
  });

  it("未滿星時 chip 不帶 data-full-stars", () => {
    const zone = resolveUniverseMap().zones.find((z) => z.id === "car-park")!;
    const html = renderToStaticMarkup(
      <ZoneIsland
        zone={zone}
        onActivate={() => undefined}
        reduced
        paused={false}
        night={false}
        progress={{ completed: 3, total: 6 }}
      />,
    );

    expect(html).not.toContain("data-full-stars");
  });

  it("開放島顯示「可以進去玩」氣球訊號，鎖島不顯示", () => {
    const zones = resolveUniverseMap().zones;
    const openHtml = renderToStaticMarkup(
      <ZoneIsland
        zone={zones.find((z) => z.id === "car-park")!}
        onActivate={() => undefined}
        reduced
        paused={false}
        night={false}
      />,
    );
    const lockedHtml = renderToStaticMarkup(
      <ZoneIsland
        zone={zones.find((z) => z.id === "dino")!}
        onActivate={() => undefined}
        reduced
        paused={false}
        night={false}
      />,
    );

    expect(openHtml).toContain("🎈");
    expect(openHtml).not.toContain("開放中");
    expect(lockedHtml).not.toContain("🎈");
  });
});
