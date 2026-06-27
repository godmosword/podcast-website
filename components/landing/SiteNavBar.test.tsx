import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

vi.stubGlobal("React", React);

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("SiteNavBar", () => {
  test("renders brand, subscribe control, and menu button", async () => {
    const { default: SiteNavBar } = await import("./SiteNavBar");
    const html = renderToStaticMarkup(<SiteNavBar />);
    expect(html).toContain("車車遊樂園");
    expect(html).toContain("訂閱收聽");
    expect(html).toContain("開啟選單");
  });

  test("play route uses compact subscribe label and play mode", async () => {
    vi.resetModules();
    vi.doMock("next/navigation", () => ({
      usePathname: () => "/story/ep-14/play",
    }));
    const { default: SiteNavBar } = await import("./SiteNavBar");
    const html = renderToStaticMarkup(<SiteNavBar />);
    expect(html).toContain('data-play-mode="true"');
    expect(html).toContain("訂閱");
    expect(html).not.toContain("訂閱收聽");
  });
});
