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
    expect(html).toContain("再玩一次");
    expect(html).toContain("繪本著色");
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

    expect(html).toContain("下一關 ▶");
    expect(html).toContain("或去玩 繪本著色");
    expect(html).not.toContain("回遊樂園");
  });

  it("可選摘要列顯示三星條件說明", async () => {
    const { GameEndStation } = await import("./GameEndStation");
    const html = renderToStaticMarkup(
      <GameEndStation
        mood="win"
        title="任務完成！"
        stars={3}
        summary="沒用道具 · 步數還很夠"
        onReplay={() => undefined}
        hideHubLink
      />,
    );
    expect(html).toContain("沒用道具 · 步數還很夠");
  });
});
