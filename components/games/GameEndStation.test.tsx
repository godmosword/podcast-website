// @vitest-environment jsdom
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.stubGlobal("React", React);

describe("GameEndStation", () => {
  it("顯示再玩、下一站與回遊樂園", async () => {
    const { GameEndStation } = await import("./GameEndStation");
    const html = renderToStaticMarkup(
      <GameEndStation
        mood="win"
        title="好厲害！"
        stars={2}
        onReplay={() => undefined}
        gameSlug="candy-match"
      />,
    );

    expect(html).toContain("好厲害！");
    expect(html).toContain('aria-label="再玩一次"');
    expect(html).toContain('aria-label="去玩：繪本著色"');
    // 去下一站＝下一款的縮圖（孩子看得出按了會去哪），不是抽象箭頭
    expect(html).toContain('src="/games/v2/coloring-book/');
    expect(html).toContain("回遊樂園");
    expect(html).toContain('href="/games/coloring-book"');
  });

  it("主鈕圖示依動作分化：下一關＝往前箭頭、換一張＝翻頁；再玩＝循環箭頭", async () => {
    const { GameEndStation } = await import("./GameEndStation");
    const next = renderToStaticMarkup(
      <GameEndStation mood="win" onReplay={() => undefined} mainAction={{ label: "下一關", icon: "next", onClick: () => undefined }} hideHubLink />,
    );
    const page = renderToStaticMarkup(
      <GameEndStation mood="win" onReplay={() => undefined} mainAction={{ label: "換一張塗", icon: "page", onClick: () => undefined }} hideHubLink />,
    );
    // 兩顆主鈕的 svg path 不同（同一顆 ▶ 不能同時代表「往前」和「翻頁」）
    const svgOf = (html: string) => html.match(/aria-label="(下一關|換一張塗)"[^>]*>(<svg[\s\S]*?<\/svg>)/)?.[2];
    expect(svgOf(next)).toBeTruthy();
    expect(svgOf(page)).toBeTruthy();
    expect(svgOf(next)).not.toEqual(svgOf(page));
  });

  it("mainAction 成為主 CTA，下一站降為次要", async () => {
    const { GameEndStation } = await import("./GameEndStation");
    const html = renderToStaticMarkup(
      <GameEndStation
        mood="win"
        title="任務完成！"
        onReplay={() => undefined}
        gameSlug="candy-match"
        mainAction={{ label: "下一關", icon: "next", onClick: () => undefined }}
        hideHubLink
      />,
    );

    expect(html).toContain('aria-label="下一關"');
    // K-12：有 mainAction 時再玩降為小 icon 鈕，不再出現「或去玩 …」文字連結
    expect(html).toContain('aria-label="再玩一次"');
    expect(html).not.toContain("或去玩");
    expect(html).not.toContain("回遊樂園");
  });

  it("K-12：按鈕只有 icon，文字只剩標題與分數", async () => {
    const { GameEndStation } = await import("./GameEndStation");
    const html = renderToStaticMarkup(
      <GameEndStation
        mood="win"
        title="任務完成！"
        stars={3}
        scoreLabel="分數 120"
        onReplay={() => undefined}
        hideHubLink
      />,
    );
    expect(html).toContain("分數 120");
    // 按鈕內只有 svg，沒有可見文字
    expect(html).toMatch(/<button[^>]*aria-label="再玩一次"[^>]*><svg/);
  });
});
