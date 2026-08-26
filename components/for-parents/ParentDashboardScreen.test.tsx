// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ParentDashboardScreen } from "./ParentDashboardScreen";
import { PARENT_GATE_SESSION_KEY } from "@/lib/parent-gate";

vi.stubGlobal("React", React);

describe("ParentDashboardScreen", () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
  });

  it("未通過時只顯示閘門，不露出儀表板設定", () => {
    render(<ParentDashboardScreen />);
    expect(screen.getByRole("heading", { name: "先確認是家長" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "家庭儀表板" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "家長快速設定" })).toBeNull();
  });

  it("session 已通過則直接顯示儀表板", async () => {
    sessionStorage.setItem(PARENT_GATE_SESSION_KEY, "1");
    render(<ParentDashboardScreen />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "家庭儀表板" })).toBeTruthy();
    });
    expect(screen.getByRole("heading", { name: "小遊戲探索摘要" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "先確認是家長" })).toBeNull();
  });
});
