import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ZONES } from "@/data/universe-zones";
import ZoneLandmark from "./ZoneLandmark";

vi.stubGlobal("React", React);

describe("ZoneLandmark", () => {
  it("有 artTile 時渲染 img", () => {
    const html = renderToStaticMarkup(
      <ZoneLandmark zoneId="car-park" artTile="/adventures/zones/car-park.svg" />,
    );
    expect(html).toContain("<img");
    expect(html).toContain('src="/adventures/zones/car-park.svg"');
  });

  it("無 artTile 時 fallback inline SVG", () => {
    const html = renderToStaticMarkup(<ZoneLandmark zoneId="dino" status="building" />);
    expect(html).toContain("<svg");
  });

  it("全部 ZONES artTile 可渲染 img", () => {
    for (const zone of ZONES) {
      const html = renderToStaticMarkup(
        <ZoneLandmark zoneId={zone.id} status={zone.status} artTile={zone.artTile} />,
      );
      expect(html, zone.id).toContain("<img");
    }
  });
});
