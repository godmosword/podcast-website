import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string): string {
  return readFileSync(path, "utf8");
}

describe("game logic regressions", () => {
  it("繽紛消消樂走 gamekit 回報、無失敗用語、有自動提示與溫柔重試", () => {
    const view = source("components/games/CandyMatchView.tsx");
    const adapter = source("lib/gamekit/games/candy-match/adapter.ts");

    expect(adapter).toContain('gameId: "candy-match"');
    expect(adapter).toContain("onSession");
    expect(view).toContain("HINT_IDLE_MS");
    expect(view).toContain("我們再試一次！");
    expect(view).toContain("掃把出發！");
    expect(view).toContain("彩虹全收！");
    expect(view).not.toContain("失敗");
    expect(view).not.toContain("Game Over");
    expect(view).not.toContain("你輸了");
  });

  it("繽紛方塊走 gamekit 回報，鍵盤主操作只由 GameInput 統一處理一次", () => {
    const view = source("components/games/BlockDropView.tsx");
    const adapter = source("lib/gamekit/games/block-drop/adapter.ts");

    expect(adapter).toContain('gameId: "block-drop"');
    expect(adapter).toContain("onSession");
    expect(view).not.toContain('if (k === "ArrowLeft") move(-1);');
    expect(view).not.toContain('else if (k === "ArrowRight") move(1);');
    expect(view).not.toContain('else if (k === "ArrowUp" || k === "x" || k === "X") rotate(1);');
    expect(view).not.toContain('else if (k === " ") hardDrop();');
    expect(view).toContain('if (k === "z" || k === "Z") doRotate(-1);');
    expect(view).toContain('else if (k === "c" || k === "C" || k === "Shift") doHold();');
    expect(view).toContain(
      'const { rotate: doRotate, holdPiece: doHold } = liveFnsRef.current;',
    );
  });

  it("繽紛方塊提供難度、彩虹模式與到頂重新開始引導", () => {
    const view = source("components/games/BlockDropView.tsx");

    expect(view).toContain("DIFFICULTY_CONFIG");
    expect(view).toContain('specialMode === "rainbow"');
    expect(view).toContain("方塊堆到頂了");
    expect(view).toContain("switchToRelaxedAndRestart");
  });

  it("遊戲頁維持既有 shell、安全距離與返回動線", () => {
    const shell = source("components/games/GamePageShell.module.css");
    const pageShell = source("components/games/GamePageShell.tsx");

    expect(shell).toContain("var(--safe-top)");
    expect(shell).toContain("min-height: 52px");
    expect(pageShell.indexOf('id="game-play"')).toBeGreaterThan(-1);
    expect(pageShell.indexOf("<GameIntro")).toBeGreaterThan(
      pageShell.indexOf('id="game-play"'),
    );
  });

  it("GameHost 工具列無條件渲染且透過 shell slot 顯示", () => {
    const host = source("lib/gamekit/host/GameHost.tsx");
    const rowIndex = host.indexOf("hostStyles.toolbarRow");
    const toolbarIndex = host.indexOf("<GameChromeToolbar");

    expect(toolbarIndex).toBeGreaterThan(rowIndex);
    expect(host).not.toContain("{(title || best != null) && (");
    expect(host).toContain("createPortal");
    expect(host).toContain("useGamePlayChromeSlot");
  });

  it("繽紛方塊暫停層含回遊樂園出口", () => {
    const block = source("components/games/BlockDropView.tsx");

    expect(block).toContain('href="/games"');
    expect(block).toContain("回遊樂園");
  });

  it("遊戲頁抬頭含 chrome slot 與 ThemeToggle", () => {
    const slot = source("components/games/GamePlayChromeSlot.tsx");
    const shell = source("components/games/GamePageShell.tsx");

    expect(slot).toContain("ThemeToggle");
    expect(slot).toContain("GamePlayChromeProvider");
    expect(shell).toContain("GamePlayHeader");
  });
});
