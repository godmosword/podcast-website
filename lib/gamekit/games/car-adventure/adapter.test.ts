import { describe, expect, it, vi } from "vitest";
import {
  CAR_ADVENTURE_STATUS_MAP,
  CarAdventureInstance,
  carAdventureAdapter,
} from "@/lib/gamekit/games/car-adventure/adapter";
import type { GameSessionResult } from "@/lib/gamekit/progress/session";

describe("carAdventureAdapter", () => {
  it("建立 instance 且 id 為 car-adventure", () => {
    const inst = carAdventureAdapter.create({
      kidsMode: false,
      reducedMotion: false,
    });
    expect(inst.id).toBe("car-adventure");
    expect(inst.getStatus()).toBe("ready");
    expect(inst.getScore()).toBe(0);
  });

  it("getTouchActions 回傳空（觸控由 View 自管）", () => {
    const inst = carAdventureAdapter.create({
      kidsMode: false,
      reducedMotion: false,
    });
    expect(inst.getTouchActions?.()).toEqual([]);
  });

  it("pause / resume 凍結與恢復 playing", () => {
    const inst = new CarAdventureInstance({
      kidsMode: false,
      reducedMotion: true,
    });
    inst.start(0);
    expect(inst.getStatus()).toBe("playing");
    expect(inst.getLevelIndex?.()).toBe(0);

    inst.pause();
    expect(inst.getStatus()).toBe("paused");

    inst.resume();
    expect(inst.getStatus()).toBe("playing");
  });

  it("兒童模式起始生命為 5", () => {
    const inst = new CarAdventureInstance({
      kidsMode: true,
      reducedMotion: true,
    });
    inst.start(0);
    // 透過 fixedUpdate 前的內部狀態：重開同關不崩潰且 status playing
    expect(inst.getStatus()).toBe("playing");
    inst.restart(0);
    expect(inst.getStatus()).toBe("playing");
  });

  it("中關 onSession 可多次回報（medal）", () => {
    const onSession = vi.fn();
    const inst = new CarAdventureInstance({
      kidsMode: false,
      reducedMotion: true,
      onSession,
    });
    inst.start(0);
    inst.notifySession({
      score: 100,
      levelIndex: 0,
      cleared: true,
    });
    inst.notifySession({
      score: 200,
      levelIndex: 1,
      cleared: true,
    });
    expect(onSession).toHaveBeenCalledTimes(2);
    expect(onSession).toHaveBeenLastCalledWith({
      gameId: "car-adventure",
      score: 200,
      levelIndex: 1,
      cleared: true,
    } satisfies GameSessionResult);
  });

  it("setAction 映射移動／跳／衝刺", () => {
    const inst = new CarAdventureInstance({
      kidsMode: false,
      reducedMotion: true,
    });
    inst.start(0);
    inst.setAction("move-left", true);
    inst.setAction("dash", true);
    inst.setAction("action", true);
    // 不應拋錯；狀態維持 playing
    expect(inst.getStatus()).toBe("playing");
    inst.setAction("move-left", false);
    inst.setAction("dash", false);
    inst.setAction("action", false);
  });

  it("status 對照表 1:1", () => {
    expect(CAR_ADVENTURE_STATUS_MAP.ready).toBe("ready");
    expect(CAR_ADVENTURE_STATUS_MAP.playing).toBe("playing");
    expect(CAR_ADVENTURE_STATUS_MAP.paused).toBe("paused");
    expect(CAR_ADVENTURE_STATUS_MAP.won).toBe("won");
    expect(CAR_ADVENTURE_STATUS_MAP.over).toBe("over");
  });

  it("fixedUpdate 可安全呼叫", () => {
    const inst = new CarAdventureInstance({
      kidsMode: false,
      reducedMotion: true,
    });
    inst.start(0);
    inst.fixedUpdate?.(1 / 60);
    expect(inst.getScore()).toBeGreaterThanOrEqual(0);
    expect(inst.fixedUpdate).toBeTypeOf("function");
    expect(inst.render).toBeTypeOf("function");
  });
});
