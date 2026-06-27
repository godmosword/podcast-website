import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ZONE_IDS } from "@/data/universe-zones";
import ZoneLandmarkArt from "./ZoneLandmarkArt";

vi.stubGlobal("React", React);

describe("ZoneLandmarkArt", () => {
  it("每座島皆渲染黏土 SVG 地標", () => {
    for (const id of ZONE_IDS) {
      const html = renderToStaticMarkup(<ZoneLandmarkArt zoneId={id} status="open" />);
      expect(html, id).toContain("<svg");
      expect(html, id).toContain("viewBox=\"0 0 96 96\"");
    }
  });
});
