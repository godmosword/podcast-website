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
});
