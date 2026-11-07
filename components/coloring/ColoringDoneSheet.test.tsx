// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { COLORING_PAGES } from "@/data/coloring-pages";
import { ColoringDoneSheet } from "./ColoringDoneSheet";

afterEach(cleanup);

const page = COLORING_PAGES.find((p) => p.storySlug) ?? COLORING_PAGES[0]!;

function renderSheet(saveFailed = false) {
  const handlers = {
    onReplay: vi.fn(),
    onChangePage: vi.fn(),
    onRetrySave: vi.fn(),
    onDownload: vi.fn(),
    onShare: vi.fn(),
    onPrint: vi.fn(),
    onStartNew: vi.fn(),
  };
  render(
    <ColoringDoneSheet
      page={page}
      snapshotUrl={null}
      collectionStatus={saveFailed ? "作品尚未收藏，請下載保存，或重試收藏。" : "作品已收藏在這台裝置"}
      saveFailed={saveFailed}
      unsaved={false}
      {...handlers}
    />,
  );
  return handlers;
}

describe("ColoringDoneSheet", () => {
  it("孩子先看到換一張（主）與繼續塗；存圖、分享、列印收在「給大人」裡", () => {
    renderSheet();
    expect(screen.getByRole("button", { name: "換一張塗" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "繼續塗這一張" })).toBeTruthy();
    for (const name of ["存圖片", "分享作品", "列印作品", "開新稿"]) {
      expect(screen.queryByRole("button", { name })).toBeNull();
    }
    const toggle = screen.getByRole("button", { name: "給大人：存圖・分享・列印" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("打開「給大人」才出現大人的動作，再按一次收起", () => {
    const handlers = renderSheet();
    const toggle = screen.getByRole("button", { name: "給大人：存圖・分享・列印" });
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "分享作品" }));
    expect(handlers.onShare).toHaveBeenCalledTimes(1);
    if (page.storySlug) expect(screen.getByRole("link", { name: "看這個故事" })).toBeTruthy();
    fireEvent.click(toggle);
    expect(screen.queryByRole("button", { name: "分享作品" })).toBeNull();
  });

  it("收藏失敗：重試收藏與存圖片直接看得到（狀態句叫大人下載保存）", () => {
    const handlers = renderSheet(true);
    fireEvent.click(screen.getByRole("button", { name: "重試收藏" }));
    expect(handlers.onRetrySave).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "存圖片" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "給大人：存圖・分享・列印" })).toBeNull();
    // 開新稿會直接清掉畫布：作品還沒收好時不放
    expect(screen.queryByRole("button", { name: "開新稿" })).toBeNull();
  });

  it("開啟時焦點在「換一張塗」", () => {
    renderSheet();
    expect(document.activeElement?.getAttribute("aria-label")).toBe("換一張塗");
  });
});
