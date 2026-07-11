import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

vi.stubGlobal("React", React);

describe("SubscriptionCTA", () => {
  test("renders subscribe block with platform links", async () => {
    const { default: SubscriptionCTA } = await import("./SubscriptionCTA");
    const html = renderToStaticMarkup(<SubscriptionCTA accent="#ff9500" />);
    expect(html).toContain('aria-label="訂閱收聽完整版"');
    expect(html).toContain("喜歡這集？在平台聽完整版並訂閱");
  });
});
