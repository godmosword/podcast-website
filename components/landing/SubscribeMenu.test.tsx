import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

vi.stubGlobal("React", React);

describe("SubscribeMenu", () => {
  test("renders subscribe dropdown trigger in nav bar", async () => {
    const { default: SubscribeMenu } = await import("./SubscribeMenu");
    const html = renderToStaticMarkup(<SubscribeMenu />);
    expect(html).toContain("訂閱");
    expect(html).toContain('aria-haspopup="menu"');
    // 文案精簡：頂欄觸發器只寫「訂閱」
    expect(html).not.toContain("訂閱收聽");
  });

  test("平台清單為空時不消失，退為站內 /subscribe（頂欄入口是版面契約）", async () => {
    vi.resetModules();
    vi.doMock("@/lib/platforms", () => ({ visiblePlatforms: () => [] }));
    const { default: SubscribeMenu } = await import("./SubscribeMenu");
    const html = renderToStaticMarkup(<SubscribeMenu />);
    expect(html).toContain('href="/subscribe"');
    expect(html).toContain("訂閱");
    vi.doUnmock("@/lib/platforms");
    vi.resetModules();
  });
});
