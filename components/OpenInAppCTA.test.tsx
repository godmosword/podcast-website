/** @vitest-environment jsdom */
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import OpenInAppCTA from "./OpenInAppCTA";

describe("OpenInAppCTA", () => {
  afterEach(() => {
    cleanup();
    Object.defineProperty(window.navigator, "userAgent", {
      configurable: true,
      value: "Mozilla/5.0",
    });
  });

  it("非 Apple 行動裝置不渲染", async () => {
    Object.defineProperty(window.navigator, "userAgent", {
      configurable: true,
      value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    });
    let container: HTMLElement | undefined;
    await act(async () => {
      container = render(
        <OpenInAppCTA href="https://example.test/story/ep-1" />,
      ).container;
    });
    expect(container?.innerHTML).toBe("");
  });

  it("iPhone 顯示用 App 開啟；可選 App Store", async () => {
    Object.defineProperty(window.navigator, "userAgent", {
      configurable: true,
      value: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
    });
    await act(async () => {
      render(
        <OpenInAppCTA
          href="https://example.test/story/ep-1"
          storeUrl="https://apps.apple.com/app/id1"
        />,
      );
    });
    const open = screen.getByRole("link", { name: "用 App 開啟本集" });
    expect(open.getAttribute("href")).toBe("https://example.test/story/ep-1");
    const store = screen.getByRole("link", { name: "App Store" });
    expect(store.getAttribute("href")).toBe("https://apps.apple.com/app/id1");
  });
});
