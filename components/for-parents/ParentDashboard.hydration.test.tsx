// @vitest-environment jsdom
import React, { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ParentDashboard } from "./ParentDashboard";

vi.stubGlobal("React", React);
vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);

vi.mock("@/components/games/GamePlayIcon", () => ({
  GamePlayIcon: () => null,
}));

const BUILD_DAY = new Date(2026, 9, 23, 20, 0, 0).getTime();
const NEXT_DAY = new Date(2026, 9, 24, 9, 0, 0).getTime();

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
});

describe("ParentDashboard 水合", () => {
  // /for-parents/dashboard 是靜態預產的頁面：HTML 在 build 那天產生，家長隔天才打開。
  // 2026-10-24 CI 在 UTC 午夜前後 build／測試，本週摘要的日期對不上，React #418。
  it("build 那天產的 HTML 隔天打開也不會水合失敗", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(BUILD_DAY);
    const html = renderToString(<ParentDashboard />);

    vi.setSystemTime(NEXT_DAY);
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);

    const recoverable: unknown[] = [];
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    await act(async () => {
      hydrateRoot(container, <ParentDashboard />, {
        onRecoverableError: (error) => recoverable.push(error),
      });
    });
    const hydrationLogs = consoleError.mock.calls.filter((args) =>
      args.some((arg) => /hydrat|didn't match/i.test(String(arg))),
    );
    consoleError.mockRestore();

    expect(recoverable).toEqual([]);
    expect(hydrationLogs).toEqual([]);
    // 掛載後換成這台裝置的 7 天，最後一天是今天。
    const weekly = container.querySelector('[aria-labelledby="weekly-heading"]');
    expect(weekly?.textContent).toContain("10月18日 – 10月24日");
    expect(weekly?.textContent).toContain("今天");
  });
});
