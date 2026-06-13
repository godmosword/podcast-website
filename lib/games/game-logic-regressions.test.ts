import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string): string {
  return readFileSync(path, "utf8");
}

describe("game logic regressions", () => {
  it("繽紛消消樂走 gamekit 回報、無失敗用語、有自動提示與溫柔重試", () => {
    const game = source("components/games/CandyMatchGame.tsx");

    expect(game).toContain("reportGameSession");
    expect(game).toContain('gameId: "candy-match"');
    expect(game).toContain("HINT_IDLE_MS");
    expect(game).toContain("我們再試一次！");
    // 兒童友善：不出現失敗／Game Over 字眼
    expect(game).not.toContain("失敗");
    expect(game).not.toContain("Game Over");
    expect(game).not.toContain("你輸了");
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

  it("繽紛卡丁車 Host 驗證來源並走 gamekit 回報，含載入降級", () => {
    const host = source("components/games/CandyKartIframeHost.tsx");

    expect(host).toContain("event.origin !== window.location.origin");
    expect(host).toContain("isCandyKartFinishMessage");
    expect(host).toContain("candyKartSessionFromFinish");
    expect(host).toContain("reportGameSession");
    expect(host).toContain("LOAD_TIMEOUT_MS");
  });

  it("繽紛卡丁車保留觸控方向與漂移控制", () => {
    const hud = source("candy-kart-game/scripts/hud.gd");
    const main = source("candy-kart-game/scripts/main.gd");

    expect(hud).toContain("DisplayServer.is_touchscreen_available()");
    expect(hud).toContain("_build_touch(root)");
    expect(hud).toContain("touch_left = true");
    expect(hud).toContain("touch_right = true");
    expect(hud).toContain("touch_drift = true");
    expect(main).toContain("hud.touch_left");
    expect(main).toContain("hud.touch_right");
    expect(main).toContain("hud.touch_drift");
  });

  it("繽紛卡丁車保留音訊解鎖與 AI rubber-banding", () => {
    const main = source("candy-kart-game/scripts/main.gd");
    const race = source("candy-kart-game/scripts/race.gd");

    expect(main).toContain("_audio_unlocked");
    expect(main).toContain("sfx.unlock()");
    expect(race).toContain("var rubber := 1.0");
    expect(race).toContain("player.progress - kart.progress");
    expect(race).toContain("clampf(1.0 + gap / 600.0 * 0.22, 0.82, 1.2)");
    expect(race).toContain("kart.step(delta, running, rubber)");
  });

  it("繽紛卡丁車 Godot 端保留 6 條主題賽道", () => {
    const trackData = source("candy-kart-game/scripts/track_data.gd");

    for (const id of [
      "macaron-meadow",
      "candy-beach",
      "jelly-forest",
      "icecream-peak",
      "choco-volcano",
      "rainbow-skyway",
    ]) {
      expect(trackData).toContain(`"id": "${id}"`);
    }
    expect(trackData).toContain("static func track_count() -> int:");
    expect(trackData).toContain("\"par_ms\"");
  });

  it("繽紛卡丁車保留大獎賽積分與糖果盃結算", () => {
    const main = source("candy-kart-game/scripts/main.gd");

    expect(main).toContain("const GP_POINTS := [10, 8, 6, 5, 4, 3, 2, 1]");
    expect(main).toContain("func _start_grand_prix() -> void:");
    expect(main).toContain("func _apply_gp_points(result: Dictionary) -> void:");
    expect(main).toContain("func _show_gp_final() -> void:");
    expect(main).toContain("繽紛糖果盃 冠軍！");
    expect(main).toContain("class CupIcon:");
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
