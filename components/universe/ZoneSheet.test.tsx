import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ZONES } from "@/data/universe-zones";
import ZoneSheet from "./ZoneSheet";

vi.stubGlobal("React", React);

describe("ZoneSheet", () => {
  it("shows an open-ended exploration note before the optional wish form", () => {
    const zone = ZONES.find((item) => item.id === "dino")!;
    const html = renderToStaticMarkup(
      <ZoneSheet zone={zone} onClose={() => undefined} />,
    );

    expect(html).toContain("恐龍島還在蓋");
    expect(html).toContain("無廣告");
    expect(html).toContain("想留一句話");
    expect(html).not.toContain("載入中");
    expect(html).not.toContain("暱稱或 Email");
    expect(html).not.toContain("之後開放投票");
  });

  it("dialog 容器帶 tabindex=-1 供初始焦點（避免開啟瞬間 ✕ 出現 focus ring）", () => {
    const zone = ZONES.find((item) => item.id === "dino")!;
    const html = renderToStaticMarkup(
      <ZoneSheet zone={zone} onClose={() => undefined} />,
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('tabindex="-1"');
  });
});
