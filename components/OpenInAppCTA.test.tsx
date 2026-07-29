/** @vitest-environment jsdom */
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import OpenInAppCTA from "./OpenInAppCTA";

const STORE_URL = "https://apps.apple.com/app/id1";

function setUserAgent(value: string, maxTouchPoints = 0): void {
  Object.defineProperty(window.navigator, "userAgent", {
    configurable: true,
    value,
  });
  Object.defineProperty(window.navigator, "maxTouchPoints", {
    configurable: true,
    value: maxTouchPoints,
  });
}

async function renderCTA(props: {
  storeUrl?: string | null;
}): Promise<HTMLElement> {
  let container!: HTMLElement;
  await act(async () => {
    container = render(
      <OpenInAppCTA
        href="https://example.test/story/ep-1"
        storeUrl={props.storeUrl}
      />,
    ).container;
  });
  return container;
}

describe("OpenInAppCTA", () => {
  afterEach(() => {
    cleanup();
    setUserAgent("Mozilla/5.0");
  });

  it("非 Apple 行動裝置不渲染", async () => {
    setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
    const container = await renderCTA({ storeUrl: STORE_URL });
    expect(container.innerHTML).toBe("");
  });

  it("App 未上架（無 storeUrl）時完全不渲染，即使在 iPhone", async () => {
    setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)");
    const container = await renderCTA({ storeUrl: null });
    expect(container.innerHTML).toBe("");
  });

  it("iPhone 顯示用 App 開啟與 App Store", async () => {
    setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)");
    await renderCTA({ storeUrl: STORE_URL });

    const open = screen.getByRole("link", { name: "用 App 開啟本集" });
    expect(open.getAttribute("href")).toBe("https://example.test/story/ep-1");
    const store = screen.getByRole("link", { name: "App Store" });
    expect(store.getAttribute("href")).toBe(STORE_URL);
  });

  it("iPadOS 桌面版 UA（Macintosh + 觸控）仍認得出來", async () => {
    setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 5);
    await renderCTA({ storeUrl: STORE_URL });
    expect(
      screen.getByRole("link", { name: "用 App 開啟本集" }),
    ).toBeTruthy();
  });

  it("真正的桌面 Mac（無觸控）不渲染", async () => {
    setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 0);
    const container = await renderCTA({ storeUrl: STORE_URL });
    expect(container.innerHTML).toBe("");
  });
});
