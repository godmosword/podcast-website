import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import ZoneWishForm from "./ZoneWishForm";

vi.stubGlobal("React", React);

describe("ZoneWishForm", () => {
  it("載入態輸出提示", () => {
    vi.stubGlobal("fetch", vi.fn());
    const html = renderToStaticMarkup(
      <ZoneWishForm zoneId="dino" fallbackHref="mailto:test@example.com" />,
    );
    expect(html).toContain("載入中");
  });
});
