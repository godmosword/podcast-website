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
    // 兒童友善：不出現失敗／Game Over 字眼
    expect(view).not.toContain("失敗");
    expect(view).not.toContain("Game Over");
    expect(view).not.toContain("你輸了");
  });

  it("車車大冒險兒童模式第一關用當局起始生命判定 flawless", () => {
    const adapter = source("lib/gamekit/games/car-adventure/adapter.ts");

    expect(adapter).toContain("const startLives = this.options.kidsMode ? 5 : 3;");
    expect(adapter).toContain("createGameState(idx, startLives, this.options.kidsMode)");
    expect(adapter).toContain("this.levelStartLives = startLives;");
  });

  it("車車大冒險選單在 Host canvas 外，避免入口 CTA 被裁切", () => {
    const view = source("components/games/CarAdventureView.tsx");
    const host = source("lib/gamekit/host/GameHost.tsx");
    const menu = source("components/games/car-adventure/CarAdventureMenu.tsx");
    const css = source(
      "components/games/car-adventure/CarAdventureMenu.module.css",
    );

    expect(view).toContain("<CarAdventureMenu");
    expect(view).not.toContain('from "@/components/games/PixelGameCanvas"');
    // Host JSX：canvas 區塊先於 renderOverlay（選單在 canvas 外）
    const canvasJsx = host.indexOf("{needsCanvas && (");
    const overlayJsx = host.indexOf("instanceRef.current?.renderOverlay?.(");
    expect(canvasJsx).toBeGreaterThan(-1);
    expect(overlayJsx).toBeGreaterThan(-1);
    expect(canvasJsx).toBeLessThan(overlayJsx);
    expect(menu).toContain("開始冒險 ▶");
    expect(menu).toContain('data-testid="car-adventure-menu"');
    expect(css).toContain("overflow: visible");
    expect(css).toContain("position: sticky");
    expect(css).toContain("min-height: 48px");
  });

  it("車車大冒險提供衝刺觸控鍵、手把/鍵盤映射與繁中教學", () => {
    const view = source("components/games/CarAdventureView.tsx");
    const adapter = source("lib/gamekit/games/car-adventure/adapter.ts");
    const input = source("lib/gamekit/runtime/input.ts");
    const games = source("data/games.ts");

    expect(view).toContain('label="衝刺"');
    expect(view).toContain('hold("dash", true)');
    expect(adapter).toContain('action === "dash"');
    expect(input).toContain('x: "dash"');
    expect(input).toContain('2: "dash"');
    expect(games).toContain("按衝刺鍵破磚");
  });

  it("繽紛方塊走 gamekit 回報、鍵盤主操作只由 GameInput 統一處理一次", () => {
    const view = source("components/games/BlockDropView.tsx");
    const adapter = source("lib/gamekit/games/block-drop/adapter.ts");

    expect(adapter).toContain('gameId: "block-drop"');
    expect(adapter).toContain("onSession");
    expect(view).not.toContain('if (k === "ArrowLeft") move(-1);');
    expect(view).not.toContain('else if (k === "ArrowRight") move(1);');
    expect(view).not.toContain('else if (k === "ArrowUp" || k === "x" || k === "X") rotate(1);');
    expect(view).not.toContain('else if (k === " ") hardDrop();');
    expect(view).toContain('if (k === "z" || k === "Z") rotate(-1);');
    expect(view).toContain('else if (k === "c" || k === "C" || k === "Shift") holdPiece();');
  });

  it("繽紛方塊提供難度、彩虹模式與到頂重新開始引導", () => {
    const view = source("components/games/BlockDropView.tsx");

    expect(view).toContain("DIFFICULTY_CONFIG");
    expect(view).toContain("specialMode === \"rainbow\"");
    expect(view).toContain("方塊堆到頂了");
    expect(view).toContain("switchToRelaxedAndRestart");
  });

  it("UX-P2-1：繽紛方塊難度預設與 kidsMode 預設同步為 relaxed，且尊重使用者明確選擇", () => {
    const settings = source("lib/gamekit/progress/settings.ts");
    const store = source("lib/progress-store.ts");

    // kidsMode 與 blockDropDifficulty 的預設值刻意保持一致（都對應「輕鬆」情境）
    expect(settings).toMatch(/kidsMode:\s*true/);
    expect(settings).toMatch(/blockDropDifficulty:\s*"relaxed"/);
    // 未明確選過時 fallback 到 relaxed；一旦選了 standard/challenge 就持久化沿用
    expect(store).toContain(
      'return value === "standard" || value === "challenge" ? value : "relaxed";',
    );
  });

  it("繽紛卡丁車 Host 驗證來源並走 gamekit 回報，含按需載入", () => {
    const view = source("components/games/CandyKartView.tsx");
    const adapter = source("lib/gamekit/games/candy-kart/adapter.ts");
    const bridge = source("lib/gamekit/games/candy-kart-bridge.ts");

    expect(view).toContain("event.origin !== window.location.origin");
    expect(view).toContain("isCandyKartFinishMessage");
    expect(view).toContain("candyKartSessionFromFinish");
    expect(view).toContain("manualStart: true");
    expect(view).toContain("readGodotLoaderProgress");
    expect(adapter).toContain("onSession");
    expect(adapter).toContain('id: "candy-kart"');
    expect(bridge).toContain('CANDY_KART_MESSAGE_SOURCE = "cheche-candy-kart"');
    expect(bridge).toContain('type: "race-finish"');
  });

  it("繽紛卡丁車保留觸控方向、漂移與煞車控制", () => {
    const hud = source("candy-kart-game/scripts/hud.gd");
    const main = source("candy-kart-game/scripts/main.gd");

    expect(hud).toContain("DisplayServer.is_touchscreen_available()");
    expect(hud).toContain("_build_touch(root)");
    expect(hud).toContain("touch_left = true");
    expect(hud).toContain("touch_right = true");
    expect(hud).toContain("touch_drift = true");
    expect(hud).toContain("touch_brake = true");
    expect(hud).toContain("update_player_meters");
    expect(main).toContain("hud.touch_left");
    expect(main).toContain("hud.touch_right");
    expect(main).toContain("hud.touch_drift");
    expect(main).toContain("hud.touch_brake");
    expect(main).toContain("hud.update_player_meters");
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
    const view = source("components/games/BlockDropView.tsx");

    expect(view).toContain("CLAY_BLOCK_COLORS");
    expect(view).toContain("macaron");
    expect(view).toContain("clearFx");
    expect(view).toContain("太棒了");
    expect(view).toContain("minHeight: 56");
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
