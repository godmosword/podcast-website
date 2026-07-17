import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ZONES } from "@/data/universe-zones";
import MapGuide from "./MapGuide";

vi.stubGlobal("React", React);

describe("MapGuide", () => {
  it("以島嶼資料推導可玩數量與狀態圖例", () => {
    const html = renderToStaticMarkup(<MapGuide zones={ZONES} />);

    expect(html).toContain("1 / 5 座可以玩");
    expect(html).toContain("🎉");
    expect(html).toContain("🚧");
    expect(html).toContain("🎁");
    expect(html).toContain("💭");
  });

  it("沒有某種狀態的島時不輸出空圖例項目", () => {
    const html = renderToStaticMarkup(
      <MapGuide zones={ZONES.filter((zone) => zone.status !== "planned")} />,
    );

    expect(html).not.toContain("💭");
    expect(html).toContain("4 座可以玩");
  });
});
