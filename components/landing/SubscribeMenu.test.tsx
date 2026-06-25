import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

vi.stubGlobal("React", React);

describe("SubscribeMenu", () => {
  test("renders subscribe dropdown trigger in nav bar", async () => {
    const { default: SubscribeMenu } = await import("./SubscribeMenu");
    const html = renderToStaticMarkup(<SubscribeMenu />);
    expect(html).toContain("訂閱收聽");
    expect(html).toContain('aria-haspopup="menu"');
  });

  test("menu variant lists all platforms", async () => {
    const { default: SubscribeMenu } = await import("./SubscribeMenu");
    const html = renderToStaticMarkup(<SubscribeMenu variant="menu" />);
    expect(html).toContain("收聽平台");
    expect(html).toContain("Spotify");
    expect(html).toContain("Apple Podcasts");
    expect(html).toContain("KKBOX");
    expect(html).toContain("YouTube");
  });
});
