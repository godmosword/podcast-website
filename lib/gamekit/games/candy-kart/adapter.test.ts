import { describe, expect, it, vi } from "vitest";
import {
  CANDY_KART_STATUS_MAP,
  CandyKartInstance,
  candyKartAdapter,
} from "@/lib/gamekit/games/candy-kart/adapter";

describe("candyKartAdapter", () => {
  it("建立 instance 且 id 為 candy-kart", () => {
    const inst = candyKartAdapter.create({
      kidsMode: false,
      reducedMotion: false,
    });
    expect(inst.id).toBe("candy-kart");
    expect(inst.getStatus()).toBe("ready");
    expect(inst.getScore()).toBe(0);
  });

  it("getTouchActions 回傳空（觸控在 Godot）", () => {
    const inst = candyKartAdapter.create({
      kidsMode: false,
      reducedMotion: false,
    });
    expect(inst.getTouchActions?.()).toEqual([]);
  });

  it("start / restart 委派 controller", () => {
    const startLoad = vi.fn();
    const retry = vi.fn();
    const inst = new CandyKartInstance({
      kidsMode: false,
      reducedMotion: false,
    });
    inst.registerController({ startLoad, retry });
    inst.start();
    inst.restart();
    expect(startLoad).toHaveBeenCalledTimes(1);
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("notifyFinish cleared → won 並觸發 onSession", () => {
    const onSession = vi.fn();
    const inst = new CandyKartInstance({
      kidsMode: false,
      reducedMotion: false,
      onSession,
    });
    inst.notifyFinish({
      gameId: "candy-kart",
      score: 5000,
      levelIndex: 0,
      cleared: true,
      flawless: true,
      collectedAll: false,
    });
    expect(inst.getStatus()).toBe("won");
    expect(inst.getScore()).toBe(5000);
    expect(inst.getLevelIndex?.()).toBe(0);
    expect(onSession).toHaveBeenCalledTimes(1);
  });

  it("notifyFinish 未 cleared → over", () => {
    const inst = new CandyKartInstance({
      kidsMode: false,
      reducedMotion: false,
    });
    inst.notifyFinish({
      gameId: "candy-kart",
      score: 100,
      levelIndex: 1,
      cleared: false,
    });
    expect(inst.getStatus()).toBe("over");
  });

  it("多賽 onSession 可多次（Host 不去重）", () => {
    const onSession = vi.fn();
    const inst = new CandyKartInstance({
      kidsMode: false,
      reducedMotion: false,
      onSession,
    });
    inst.notifyFinish({
      gameId: "candy-kart",
      score: 1,
      levelIndex: 0,
      cleared: true,
    });
    inst.notifyFinish({
      gameId: "candy-kart",
      score: 2,
      levelIndex: 1,
      cleared: false,
    });
    expect(onSession).toHaveBeenCalledTimes(2);
  });

  it("status 對照表涵蓋載入與結算", () => {
    expect(CANDY_KART_STATUS_MAP.idle).toBe("ready");
    expect(CANDY_KART_STATUS_MAP.loading).toBe("ready");
    expect(CANDY_KART_STATUS_MAP.loaded).toBe("ready");
    expect(CANDY_KART_STATUS_MAP.finishedWin).toBe("won");
    expect(CANDY_KART_STATUS_MAP.finishedLose).toBe("over");
  });
});
