import { describe, expect, it, vi } from "vitest";
import {
  BLOCK_DROP_STATUS_MAP,
  BlockDropInstance,
  blockDropAdapter,
} from "@/lib/gamekit/games/block-drop/adapter";

describe("blockDropAdapter", () => {
  it("建立 instance 且 id 為 block-drop", () => {
    const inst = blockDropAdapter.create({
      kidsMode: false,
      reducedMotion: false,
    });
    expect(inst.id).toBe("block-drop");
    expect(inst.getStatus()).toBe("ready");
    expect(inst.getScore()).toBe(0);
  });

  it("getTouchActions 回傳空（觸控由 View 自管）", () => {
    const inst = blockDropAdapter.create({
      kidsMode: false,
      reducedMotion: false,
    });
    expect(inst.getTouchActions?.()).toEqual([]);
  });

  it("pause / resume 委派 controller", () => {
    const pause = vi.fn();
    const resume = vi.fn();
    const inst = new BlockDropInstance({
      kidsMode: false,
      reducedMotion: false,
    });
    inst.registerController({
      begin: vi.fn(),
      pause,
      resume,
    });
    inst.notifyPlaying(10);
    inst.pause();
    expect(pause).toHaveBeenCalledTimes(1);

    inst.notifyPaused();
    inst.resume();
    expect(resume).toHaveBeenCalledTimes(1);
  });

  it("notifyOver 觸發 onSession 且只一次", () => {
    const onSession = vi.fn();
    const inst = new BlockDropInstance({
      kidsMode: false,
      reducedMotion: false,
      onSession,
    });
    inst.notifyOver(420);
    inst.notifyOver(999);
    expect(inst.getStatus()).toBe("over");
    expect(inst.getScore()).toBe(999);
    expect(onSession).toHaveBeenCalledTimes(1);
    expect(onSession).toHaveBeenCalledWith({
      gameId: "block-drop",
      score: 420,
    });
  });

  it("start / restart 呼叫 controller.begin", () => {
    const begin = vi.fn();
    const inst = new BlockDropInstance({
      kidsMode: false,
      reducedMotion: false,
    });
    inst.registerController({
      begin,
      pause: vi.fn(),
      resume: vi.fn(),
    });
    inst.start();
    inst.restart();
    expect(begin).toHaveBeenCalledTimes(2);
  });

  it("status 對照表涵蓋 ready/playing/paused/over", () => {
    expect(BLOCK_DROP_STATUS_MAP.ready).toBe("ready");
    expect(BLOCK_DROP_STATUS_MAP.playing).toBe("playing");
    expect(BLOCK_DROP_STATUS_MAP.paused).toBe("paused");
    expect(BLOCK_DROP_STATUS_MAP.over).toBe("over");
  });
});
