// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import IllustrationQueuePanel from "./IllustrationQueuePanel";

vi.stubGlobal("React", React);

afterEach(() => {
  cleanup();
});

describe("IllustrationQueuePanel", () => {
  test("列出目前待生圖的 MVP 集", () => {
    render(<IllustrationQueuePanel />);
    expect(screen.getByRole("heading", { name: "待生圖佇列" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /ep-26/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: /ep-25/ })).toBeTruthy();
    expect(screen.getByText("字幕尚未校對", { exact: false })).toBeTruthy();
    expect(screen.getByText("字幕已校對", { exact: false })).toBeTruthy();
  });
});
