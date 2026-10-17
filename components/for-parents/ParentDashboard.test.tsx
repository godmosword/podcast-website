// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { storiesByNewest } from "@/data/content";
import { emptyActivityLog, localDateKey, type ActivityLogV1 } from "@/lib/activity-log";
import {
  buildParentDashboardSnapshot,
  type ParentDashboardSnapshot,
} from "@/lib/for-parents/dashboard";
import { DEFAULT_PROGRESS } from "@/lib/progress-store";
import { storyDisplayTitle } from "@/lib/story-title";
import { ParentDashboard } from "./ParentDashboard";

vi.stubGlobal("React", React);

let snapshot: ParentDashboardSnapshot;

vi.mock("@/hooks/useParentDashboard", () => ({
  useParentDashboard: () => snapshot,
}));

vi.mock("@/components/games/GamePlayIcon", () => ({
  GamePlayIcon: () => null,
}));

const TODAY = new Date(2026, 9, 17, 12, 0, 0).getTime();

function weekWithListening(): ActivityLogV1 {
  return {
    ...emptyActivityLog("device-test-3333"),
    days: {
      [localDateKey(TODAY)]: {
        stories: { "ep-15": { seconds: 1260, plays: 1, completions: 1 } },
        games: { "candy-match": { seconds: 540, sessions: 3, clears: 2 } },
      },
    },
  };
}

afterEach(cleanup);

describe("ParentDashboard", () => {
  it("新裝置：從這裡開始推最新一集，不出現 0 數字格與「還沒聽」清單", () => {
    snapshot = buildParentDashboardSnapshot(DEFAULT_PROGRESS, emptyActivityLog(), TODAY);
    const newest = storiesByNewest()[0]!;
    render(<ParentDashboard />);

    expect(screen.getByRole("heading", { name: "從這裡開始" })).toBeTruthy();
    const cta = screen.getByRole("link", {
      name: `聽最新一集：${storyDisplayTitle(newest)}`,
    });
    expect(cta.getAttribute("href")).toBe(`/story/${newest.slug}`);

    expect(screen.getByText(/這週還沒有紀錄/)).toBeTruthy();
    expect(screen.queryByText("玩過的遊戲")).toBeNull();
    expect(screen.queryByText("0")).toBeNull();

    const progress = screen.getByRole("region", { name: "故事進度" });
    expect(within(progress).getByRole("link", { name: "去全部故事挑一集" })).toBeTruthy();
    expect(within(progress).queryByText("還沒聽")).toBeNull();

    const games = screen.getByRole("region", { name: "小遊戲" });
    expect(within(games).getByRole("link", { name: "去遊樂園" }).getAttribute("href")).toBe(
      "/games",
    );
  });

  it("有紀錄：繼續聽直接進播放頁，故事進度只列聽過的集數並分組", () => {
    snapshot = buildParentDashboardSnapshot(
      {
        ...DEFAULT_PROGRESS,
        favorites: ["ep-13"],
        continue: { slug: "ep-24", page: 2, time: 40, updatedAt: TODAY },
      },
      weekWithListening(),
      TODAY,
    );
    render(<ParentDashboard />);

    expect(screen.getByRole("heading", { name: "接著聽" })).toBeTruthy();
    const resume = screen.getByRole("link", { name: /^繼續聽：/ });
    expect(resume.getAttribute("href")).toBe("/story/ep-24/play");
    expect(screen.getByText(/EP 24 · 第 3 頁/)).toBeTruthy();

    const progress = screen.getByRole("region", { name: "故事進度" });
    expect(within(progress).getByText("聽過 2 集，共 " + snapshot.totalStories + " 集")).toBeTruthy();
    const done = within(progress).getByRole("group", { name: /聽完了/ });
    expect(within(done).getByRole("link", { name: /恐龍車多多洗手故事/ })).toBeTruthy();
    const halfway = within(progress).getByRole("group", { name: /聽到一半/ });
    expect(within(halfway).getAllByRole("link")).toHaveLength(1);
    expect(within(progress).queryByRole("link", { name: /EP 1$/ })).toBeNull();

    const weekly = screen.getByRole("region", { name: "本週摘要" });
    expect(weekly.textContent).toContain("收聽21分鐘 · 1 集");
    expect(weekly.textContent).toContain("遊戲9分鐘");
    expect(within(weekly).getByText("今天")).toBeTruthy();

    const games = screen.getByRole("region", { name: "小遊戲" });
    expect(within(games).getByText("本週 9 分鐘 · 3 局")).toBeTruthy();
    expect(within(games).getByText("這週玩了 1 款，共 9 分鐘")).toBeTruthy();
  });
});
