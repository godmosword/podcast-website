import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string): string {
  return readFileSync(path, "utf8");
}

describe("game logic regressions", () => {
  it("海盜卡丁車必須繞回起點才算完成一圈", () => {
    const page = source("lib/games/pirate-kart/tracks.ts");

    expect(page).toContain(
      "const CHECK_ANGLES = [Math.PI * 0.5, Math.PI, Math.PI * 1.5, Math.PI * 2];",
    );
  });

  it("車車大冒險兒童模式第一關用當局起始生命判定 flawless", () => {
    const game = source("components/games/CarPlatformer.tsx");

    expect(game).toContain("const startLives = kidsModeRef.current ? 5 : 3;");
    expect(game).toContain("lives: startLives,");
    expect(game).toContain("levelStartLivesRef.current = startLives;");
  });

  it("繽紛方塊鍵盤主操作只由 GameInput 統一處理一次", () => {
    const game = source("components/games/BlockDropGame.tsx");

    expect(game).not.toContain('if (k === "ArrowLeft") move(-1);');
    expect(game).not.toContain('else if (k === "ArrowRight") move(1);');
    expect(game).not.toContain('else if (k === "ArrowUp" || k === "x" || k === "X") rotate(1);');
    expect(game).not.toContain('else if (k === " ") hardDrop();');
    expect(game).toContain('if (k === "z" || k === "Z") rotate(-1);');
    expect(game).toContain('else if (k === "c" || k === "C" || k === "Shift") holdPiece();');
  });

  it("繽紛方塊提供難度、彩虹模式與到頂重新開始引導", () => {
    const game = source("components/games/BlockDropGame.tsx");

    expect(game).toContain("DIFFICULTY_CONFIG");
    expect(game).toContain("specialMode === \"rainbow\"");
    expect(game).toContain("方塊堆到頂了");
    expect(game).toContain("switchToRelaxedAndRestart");
  });

  it("繽紛樂園使用黏土馬卡龍風格、大按鈕與消排慶祝效果", () => {
    const game = source("components/games/BlockDropGame.tsx");

    expect(game).toContain("CLAY_BLOCK_COLORS");
    expect(game).toContain("macaron");
    expect(game).toContain("clearFx");
    expect(game).toContain("太棒了");
    expect(game).toContain("minHeight: 56");
  });

  it("遊戲頁保留頂部安全距離與較大的返回鍵點擊區", () => {
    const shell = source("components/games/GamePageShell.module.css");

    expect(shell).toContain("padding-top: clamp(2.25rem");
    expect(shell).toContain("min-height: 52px");
  });

  it("GameChrome 不再於暫停時跳出全螢幕選單", () => {
    const chrome = source("components/games/GameChrome.tsx");

    expect(chrome).not.toContain("<PauseOverlay");
  });
});
