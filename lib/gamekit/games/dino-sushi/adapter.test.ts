import { describe, expect, it, vi } from "vitest";
import {
  DinoSushiInstance,
  dinoSushiAdapter,
  type DinoSushiController,
} from "@/lib/gamekit/games/dino-sushi/adapter";

function controller(): DinoSushiController & Record<keyof DinoSushiController, ReturnType<typeof vi.fn>> {
  return { startOrder: vi.fn(), startFree: vi.fn(), restart: vi.fn(), goToTitle: vi.fn() };
}

describe("dinoSushiAdapter", () => {
  it("建立 instance；沒有遊戲迴圈（天生沒有計時）", () => {
    const inst = dinoSushiAdapter.create({ kidsMode: true, reducedMotion: false });
    expect(inst.id).toBe("dino-sushi");
    expect(inst.getStatus()).toBe("ready");
    expect(inst.getScore()).toBe(0);
    expect(inst.fixedUpdate).toBeUndefined();
    expect(inst.render).toBeUndefined();
    expect(inst.showsScore?.()).toBe(false);
  });

  it("標題頁 start＝開始點餐；playing 時再按 start 不重開（冪等）", () => {
    vi.useFakeTimers();
    const ctrl = controller();
    const inst = new DinoSushiInstance({ kidsMode: true, reducedMotion: false });
    inst.registerController(ctrl);
    inst.notifyReady();
    vi.advanceTimersByTime(1000);
    inst.start();
    expect(ctrl.startOrder).toHaveBeenCalledTimes(1);
    inst.notifyPlaying("order");
    inst.start();
    inst.start();
    expect(ctrl.startOrder).toHaveBeenCalledTimes(1);
    expect(ctrl.restart).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("結算用 Enter 按「回標題」：同一次按鍵帶出的 start() 不會直接開始點餐", () => {
    vi.useFakeTimers();
    const ctrl = controller();
    const inst = new DinoSushiInstance({ kidsMode: true, reducedMotion: false });
    inst.registerController(ctrl);
    inst.notifyPlaying("order");
    inst.notifyWon({ cleared: true, flawless: false, collectedAll: false });
    inst.notifyReady();
    inst.start();
    expect(ctrl.startOrder).not.toHaveBeenCalled();
    vi.advanceTimersByTime(500);
    inst.start();
    expect(ctrl.startOrder).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("結算後 start／restart 都是同模式再來一輪", () => {
    const ctrl = controller();
    const inst = new DinoSushiInstance({ kidsMode: true, reducedMotion: false });
    inst.registerController(ctrl);
    inst.notifyPlaying("order");
    inst.notifyWon({ cleared: true, flawless: false, collectedAll: false });
    inst.start();
    inst.restart();
    expect(ctrl.restart).toHaveBeenCalledTimes(2);
  });

  it("標題頁 restart 回標題", () => {
    const ctrl = controller();
    const inst = new DinoSushiInstance({ kidsMode: true, reducedMotion: false });
    inst.registerController(ctrl);
    inst.notifyReady();
    inst.restart();
    expect(ctrl.goToTitle).toHaveBeenCalledTimes(1);
  });

  it("pause / resume", () => {
    const inst = new DinoSushiInstance({ kidsMode: true, reducedMotion: false });
    inst.notifyPlaying("order");
    inst.pause();
    expect(inst.getStatus()).toBe("paused");
    expect(inst.isInputPaused()).toBe(true);
    inst.resume();
    expect(inst.getStatus()).toBe("playing");
    expect(inst.isInputPaused()).toBe(false);
  });

  it("點餐結算回報 levelIndex 0 與三個 medal flag，一輪只回報一次", () => {
    const onSession = vi.fn();
    const inst = new DinoSushiInstance({ kidsMode: true, reducedMotion: false, onSession });
    inst.notifyPlaying("order");
    inst.notifyWon({ cleared: true, flawless: true, collectedAll: false });
    inst.notifyWon({ cleared: true, flawless: true, collectedAll: true });
    expect(inst.getStatus()).toBe("won");
    expect(onSession).toHaveBeenCalledTimes(1);
    expect(onSession).toHaveBeenCalledWith({
      gameId: "dino-sushi",
      score: 0,
      levelIndex: 0,
      cleared: true,
      flawless: true,
      collectedAll: false,
    });
    inst.notifyPlaying("order");
    inst.notifyWon({ cleared: true, flawless: false, collectedAll: false });
    expect(onSession).toHaveBeenCalledTimes(2);
  });

  it("自由做：第一盤送出時回報一次 played，不給星", () => {
    const onSession = vi.fn();
    const inst = new DinoSushiInstance({ kidsMode: true, reducedMotion: false, onSession });
    inst.notifyPlaying("free");
    inst.notifyServed();
    inst.notifyServed();
    expect(onSession).toHaveBeenCalledTimes(1);
    expect(onSession).toHaveBeenCalledWith({ gameId: "dino-sushi", score: 0 });
    inst.notifyFinished();
    expect(inst.getStatus()).toBe("won");
    expect(onSession).toHaveBeenCalledTimes(1);
  });

  it("點餐模式送盤不另外回報", () => {
    const onSession = vi.fn();
    const inst = new DinoSushiInstance({ kidsMode: true, reducedMotion: false, onSession });
    inst.notifyPlaying("order");
    inst.notifyServed();
    expect(onSession).not.toHaveBeenCalled();
  });
});
