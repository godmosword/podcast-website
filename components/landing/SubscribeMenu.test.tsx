import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

vi.stubGlobal("React", React);

describe("ConnectMenu", () => {
  test("頻道觸發器帶下拉，文案不是訂閱", async () => {
    const { default: ConnectMenu } = await import("./SubscribeMenu");
    const html = renderToStaticMarkup(
      <ConnectMenu kind="channels" open onOpenChange={() => {}} />,
    );
    expect(html).toContain("頻道");
    expect(html).toContain('aria-haspopup="menu"');
    expect(html).toContain("Spotify");
    expect(html).not.toContain("訂閱");
    expect(html).not.toContain("訂閱收聽");
  });

  test("YouTube 那一列不再顯示同名文字（名稱留給讀屏）；KKBOX 字標太小，文字照留", async () => {
    const { default: ConnectMenu } = await import("./SubscribeMenu");
    const html = renderToStaticMarkup(
      <ConnectMenu kind="channels" open onOpenChange={() => {}} />,
    );
    expect(html).toMatch(/<span class="sr-only">\s*YouTube\s*<\/span>/);
    expect(html).not.toMatch(/<span class="sr-only">\s*KKBOX\s*<\/span>/);
    // 圖示型標誌的名稱仍然看得到。
    expect(html).not.toMatch(/<span class="sr-only">\s*Spotify\s*<\/span>/);
    expect(html).not.toMatch(/<span class="sr-only">\s*Apple Podcasts\s*<\/span>/);
  });

  test("社群觸發器帶下拉，只有 IG／Threads／Facebook", async () => {
    const { default: ConnectMenu } = await import("./SubscribeMenu");
    const html = renderToStaticMarkup(
      <ConnectMenu kind="socials" open onOpenChange={() => {}} />,
    );
    expect(html).toContain("社群");
    expect(html).toContain("Instagram");
    expect(html).toContain("Threads");
    expect(html).toContain("Facebook");
    expect(html).not.toContain("mailto:");
    expect(html).not.toContain("Email");
    expect(html).not.toContain("訂閱");
  });

  test("平台清單為空時頻道不消失，退為站內 /subscribe", async () => {
    vi.resetModules();
    vi.doMock("@/lib/platforms", () => ({ visiblePlatforms: () => [] }));
    const { default: ConnectMenu } = await import("./SubscribeMenu");
    const html = renderToStaticMarkup(<ConnectMenu kind="channels" />);
    expect(html).toContain('href="/subscribe"');
    expect(html).toContain("頻道");
    vi.doUnmock("@/lib/platforms");
    vi.resetModules();
  });

  test("社群清單為空時不渲染", async () => {
    vi.resetModules();
    vi.doMock("@/lib/social", () => ({
      visibleSocials: () => [],
      visibleNavSocials: () => [],
    }));
    const { default: ConnectMenu } = await import("./SubscribeMenu");
    const html = renderToStaticMarkup(<ConnectMenu kind="socials" />);
    expect(html).toBe("");
    vi.doUnmock("@/lib/social");
    vi.resetModules();
  });
});
