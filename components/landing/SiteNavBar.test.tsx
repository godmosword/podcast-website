import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

vi.stubGlobal("React", React);

describe("SiteNavBar", () => {
  test("renders brand and menu button", async () => {
    const { default: SiteNavBar } = await import("./SiteNavBar");
    const html = renderToStaticMarkup(<SiteNavBar />);
    expect(html).toContain("車車遊樂園");
    expect(html).toContain("開啟選單");
  });
});
