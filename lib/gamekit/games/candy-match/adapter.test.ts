import { describe, expect, it, vi } from "vitest";
import {
  CANDY_MATCH_STATUS_MAP,
  CandyMatchInstance,
  candyMatchAdapter,
} from "@/lib/gamekit/games/candy-match/adapter";
import type { GameSessionResult } from "@/lib/gamekit/progress/session";

describe("candyMatchAdapter", () => {
  it("建立 instance 且 id 為 candy-match", () => {
    const inst = candyMatchAdapter.create({ kidsMode: false, reducedMotion: false });
    expect(inst.id).toBe("candy-match");
    expect(inst.getStatus()).toBe("ready");
    expect(inst.getScore()).toBe(0);
  });

  it("getTouchActions 回傳空陣列（點格遊戲）", () => {
    const inst = candyMatchAdapter.create({ kidsMode: false, reducedMotion: false });
    expect(inst.getTouchActions?.()).toEqual([]);
  });

  it("pause / resume 凍結與恢復 playing 狀態", () => {
    const inst = new CandyMatchInstance({ kidsMode: false, reducedMotion: false });
    inst.registerController({
      goToMap: vi.fn(),
      goToTitle: vi.fn(),
      startLevel: vi.fn(),
      restartCurrentLevel: vi.fn(),
    });
    inst.notifyPlaying(0, 42);
    expect(inst.getStatus()).toBe("playing");
    expect(inst.getScore()).toBe(42);
    expect(inst.getLevelIndex?.()).toBe(0);

    inst.pause();
    expect(inst.getStatus()).toBe("paused");
    expect(inst.isInputPaused()).toBe(true);

    inst.resume();
    expect(inst.getStatus()).toBe("playing");
    expect(inst.isInputPaused()).toBe(false);
  });

  it("notifyWon 觸發 onSession 且 payload 形狀不變", () => {
    const onSession = vi.fn();
    const inst = new CandyMatchInstance({
      kidsMode: true,
      reducedMotion: false,
      onSession,
    });

    inst.notifyWon({
      score: 120,
      levelIndex: 2,
      cleared: true,
      flawless: true,
      collectedAll: false,
    });

    expect(inst.getStatus()).toBe("won");
    expect(inst.getScore()).toBe(120);
    expect(onSession).toHaveBeenCalledTimes(1);
    expect(onSession).toHaveBeenCalledWith({
      gameId: "candy-match",
      score: 120,
      levelIndex: 2,
      cleared: true,
      flawless: true,
      collectedAll: false,
    } satisfies GameSessionResult);
  });

  it("notifyWon 只回報一次 session", () => {
    const onSession = vi.fn();
    const inst = new CandyMatchInstance({
      kidsMode: false,
      reducedMotion: false,
      onSession,
    });
    inst.notifyWon({ score: 10, levelIndex: 0, cleared: true });
    inst.notifyWon({ score: 99, levelIndex: 0, cleared: true });
    expect(onSession).toHaveBeenCalledTimes(1);
  });

  it("notifyRetry 對應 over 狀態", () => {
    const inst = new CandyMatchInstance({ kidsMode: false, reducedMotion: false });
    inst.notifyPlaying(1, 0);
    inst.notifyRetry();
    expect(inst.getStatus()).toBe("over");
  });

  it("start 從 title 進入 map（ready）", () => {
    const goToMap = vi.fn();
    const inst = new CandyMatchInstance({ kidsMode: false, reducedMotion: false });
    inst.registerController({
      goToMap,
      goToTitle: vi.fn(),
      startLevel: vi.fn(),
      restartCurrentLevel: vi.fn(),
    });
    inst.notifyReady("title");
    inst.start();
    expect(goToMap).toHaveBeenCalledTimes(1);
  });

  it("restart 在 playing 時重開當關", () => {
    const startLevel = vi.fn();
    const inst = new CandyMatchInstance({ kidsMode: false, reducedMotion: false });
    inst.registerController({
      goToMap: vi.fn(),
      goToTitle: vi.fn(),
      startLevel,
      restartCurrentLevel: vi.fn(),
    });
    inst.notifyPlaying(3, 0);
    inst.restart();
    expect(startLevel).toHaveBeenCalledWith(3);
  });

  it("status 對照表涵蓋 title/map/play/win/retry/paused", () => {
    expect(CANDY_MATCH_STATUS_MAP.title).toBe("ready");
    expect(CANDY_MATCH_STATUS_MAP.map).toBe("ready");
    expect(CANDY_MATCH_STATUS_MAP.play).toBe("playing");
    expect(CANDY_MATCH_STATUS_MAP.win).toBe("won");
    expect(CANDY_MATCH_STATUS_MAP.retry).toBe("over");
    expect(CANDY_MATCH_STATUS_MAP.paused).toBe("paused");
  });
});
