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
        gameSlug="dino-sushi"
      />,
    );

    expect(html).toContain("好厲害！");
    expect(html).toContain('aria-label="再玩一次"');
    expect(html).toContain('aria-label="去玩：繪本塗塗鴉"');
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

  it("leadingAction 和主次鈕同一排，DOM 排在主鈕後（開啟時焦點先落主鈕）", async () => {
    const { GameEndStation } = await import("./GameEndStation");
    const html = renderToStaticMarkup(
      <GameEndStation
        mood="win"
        onReplay={() => undefined}
        mainAction={{ label: "下一站", icon: "next", onClick: () => undefined }}
        leadingAction={{ label: "回地圖", icon: <svg />, onClick: () => undefined }}
        hideHubLink
      />,
    );
    const order = [...html.matchAll(/aria-label="(下一站|再玩一次|回地圖)"/g)].map((m) => m[1]);
    expect(order).toEqual(["下一站", "再玩一次", "回地圖"]);
  });

  it("mainAction 帶 thumbnail：主鈕放朋友＋箭頭徽章，名稱不變；翻面標在圖上", async () => {
    const { GameEndStation } = await import("./GameEndStation");
    const html = renderToStaticMarkup(
      <GameEndStation
        mood="win"
        onReplay={() => undefined}
        mainAction={{ label: "開始第 2 天", icon: "next", onClick: () => undefined, thumbnail: { src: "/x/anan.webp", flip: true } }}
        hideHubLink
      />,
    );
    const main = html.match(/<button[^>]*aria-label="開始第 2 天"[^>]*>([\s\S]*?)<\/button>/)?.[1] ?? "";
    expect(main).toContain('src="/x/anan.webp"');
    expect(main).toContain('alt=""');
    expect(main).toContain('data-flip="true"');
    expect(main).toContain("<svg");
  });

  it("mainAction 沒帶 thumbnail：主鈕沒有圖，其他遊戲不受影響", async () => {
    const { GameEndStation } = await import("./GameEndStation");
    const html = renderToStaticMarkup(
      <GameEndStation mood="win" onReplay={() => undefined} mainAction={{ label: "下一關", icon: "next", onClick: () => undefined }} hideHubLink />,
    );
    const main = html.match(/<button[^>]*aria-label="下一關"[^>]*>([\s\S]*?)<\/button>/)?.[1] ?? "";
    expect(main).not.toContain("<img");
  });
});

describe("GameEndStation 開啟時的焦點", () => {
  it("details 裡有可按的東西（例如貼紙 +N），焦點仍落在主鈕", async () => {
    const { cleanup, render } = await import("@testing-library/react");
    const { GameEndStation } = await import("./GameEndStation");
    render(
      <GameEndStation
        mood="win"
        onReplay={() => undefined}
        mainAction={{ label: "開始第 2 天", icon: "next", onClick: () => undefined }}
        details={<button type="button">+3</button>}
        leadingAction={{ label: "回標題", icon: <span />, onClick: () => undefined }}
        hideHubLink
      />,
    );
    expect(document.activeElement?.getAttribute("aria-label")).toBe("開始第 2 天");
    cleanup();
  });

  it("沒有 mainAction：焦點落在再玩主鈕，不是 details 裡的按鈕", async () => {
    const { cleanup, render } = await import("@testing-library/react");
    const { GameEndStation } = await import("./GameEndStation");
    render(
      <GameEndStation
        mood="retry"
        onReplay={() => undefined}
        replayLabel="再來一次"
        details={<button type="button">看提示</button>}
        hideHubLink
      />,
    );
    expect(document.activeElement?.getAttribute("aria-label")).toBe("再來一次");
    cleanup();
  });
});
