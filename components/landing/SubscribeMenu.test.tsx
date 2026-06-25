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
});
