// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

vi.stubGlobal("React", React);

vi.mock("@/lib/illustration-queue-query", () => ({
  pendingIllustrationsForStudio: () => [
    {
      slug: "ep-26",
      ep: 26,
      syncedAt: "2026-08-19T00:00:00+08:00",
      subtitleReady: false,
      status: "awaiting-illustrate" as const,
      title: "測試集二十六",
    },
    {
      slug: "ep-25",
      ep: 25,
      syncedAt: "2026-08-12T00:00:00+08:00",
      subtitleReady: true,
      status: "awaiting-illustrate" as const,
      title: "測試集二十五",
    },
  ],
}));

import IllustrationQueuePanel from "./IllustrationQueuePanel";

afterEach(() => {
  cleanup();
});

describe("IllustrationQueuePanel", () => {
  test("列出注入的待生圖 MVP 集（不讀 live catalog，以免 sync 新集擋 GHA）", () => {
    render(<IllustrationQueuePanel />);
    expect(screen.getByRole("heading", { name: "待生圖佇列" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /ep-26/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: /ep-25/ })).toBeTruthy();
    expect(
      screen.getAllByText("字幕尚未校對", { exact: false }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText("字幕已校對", { exact: false }).length,
    ).toBeGreaterThanOrEqual(1);
  });
});
