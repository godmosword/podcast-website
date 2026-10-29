// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { loadEpisodeBoard } from "@/lib/episode-board";
import EpisodeBoard from "./EpisodeBoard";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe("EpisodeBoard", () => {
  beforeEach(() => {
    vi.stubGlobal("requestAnimationFrame", () => 1);
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("看得到車車名字，播放連到站內，沒有外連", () => {
    const { actors } = loadEpisodeBoard();
    const { unmount } = render(
      <EpisodeBoard actors={actors} nextAnchorId="segment-bedtime" />,
    );
    expect(screen.getByRole("heading", { name: "這一集的車車" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /恐龍車多多/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /小紅賽車/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /小貨車灰灰/ })).toBeTruthy();
    expect(document.querySelector("a[href^='http']")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /恐龍車多多/ }));
    const play = screen.getByRole("link", { name: "播放這一集" });
    expect(play.getAttribute("href")).toBe("/story/ep-35/play");
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("這一集")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "關掉" }));
    expect(screen.queryByRole("dialog")).toBeNull();

    const cancel = window.cancelAnimationFrame as ReturnType<typeof vi.fn>;
    unmount();
    expect(cancel).toHaveBeenCalled();
  });

  it("方向鍵可以換一台車", () => {
    const { actors } = loadEpisodeBoard();
    render(<EpisodeBoard actors={actors} nextAnchorId="segment-bedtime" />);
    const first = screen.getByRole("button", { name: /恐龍車多多/ });
    first.focus();
    fireEvent.keyDown(first, { key: "ArrowRight" });
    expect(document.activeElement?.textContent).toMatch(/小紅賽車|小貨車灰灰/);
  });

  it("沒有有效集數時顯示空狀態，不丟例外", () => {
    render(
      <EpisodeBoard
        actors={[
          {
            id: "bad",
            character: "duo-duo",
            action: "idle",
            name: "多多",
            actionLabel: "休息",
            title: "外連",
            summary: "不該出現",
            href: "https://example.com",
            featured: true,
          },
        ]}
        nextAnchorId="segment-bedtime"
      />,
    );
    expect(screen.getAllByText("車車還在路上，晚點再來找他們。").length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: "播放這一集" })).toBeNull();
  });
});
