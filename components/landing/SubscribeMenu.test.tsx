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

  test("社群觸發器帶下拉，含 Email 與外連", async () => {
    const { default: ConnectMenu } = await import("./SubscribeMenu");
    const html = renderToStaticMarkup(
      <ConnectMenu kind="socials" open onOpenChange={() => {}} />,
    );
    expect(html).toContain("社群");
    expect(html).toContain("Instagram");
    expect(html).toContain("mailto:bonboncarstory@gmail.com");
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
    vi.doMock("@/lib/social", () => ({ visibleSocials: () => [] }));
    const { default: ConnectMenu } = await import("./SubscribeMenu");
    const html = renderToStaticMarkup(<ConnectMenu kind="socials" />);
    expect(html).toBe("");
    vi.doUnmock("@/lib/social");
    vi.resetModules();
  });
});
