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
    expect(html).toContain("回遊樂園");
    expect(html).toContain('href="/games/coloring-book"');
  });

  it("mainAction 成為主 CTA，下一站降為次要", async () => {
    const { GameEndStation } = await import("./GameEndStation");
    const html = renderToStaticMarkup(
      <GameEndStation
        mood="win"
        title="任務完成！"
        onReplay={() => undefined}
        gameSlug="candy-match"
        mainAction={{ label: "下一關 ▶", onClick: () => undefined }}
        hideHubLink
      />,
    );

    expect(html).toContain('aria-label="下一關 ▶"');
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
