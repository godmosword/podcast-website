import { beforeEach, describe, expect, it, vi } from "vitest";
import { getLifetimeStars } from "@/lib/gamekit/progress/economy";
import { reportGameSession } from "@/lib/gamekit/progress/session";
import {
  OrangeExpressInstance,
  orangeExpressAdapter,
  type OrangeExpressController,
} from "@/lib/gamekit/games/orange-express/adapter";
import { createRun, step, withHook } from "@/lib/games/orange-express/reducer";

function controller(): OrangeExpressController {
  return {
    startSelected: vi.fn(),
    restart: vi.fn(),
    goToTitle: vi.fn(),
    onAction: vi.fn(),
  };
}

function finishLook() {
  let state = withHook(createRun("look"), { progress: 0.6, speed: 0 });
  state = step(state, { type: "open-doors" });
  for (let i = 0; i < 8; i += 1) state = step(state, { type: "tick", dt: 0.1 });
  return step(state, { type: "close-doors" });
}

describe("orangeExpressAdapter", () => {
  it("沒有 Host 的像素迴圈，也不顯示分數", () => {
    const inst = orangeExpressAdapter.create({ kidsMode: true, reducedMotion: false });
    expect(inst.id).toBe("orange-express");
    expect(inst.fixedUpdate).toBeUndefined();
    expect(inst.render).toBeUndefined();
    expect(inst.showsScore?.()).toBe(false);
    expect(inst.getScore()).toBe(0);
  });

  it("按鍵只在剛按下時送一次", () => {
    const ctrl = controller();
    const inst = new OrangeExpressInstance({ kidsMode: true, reducedMotion: false });
    inst.registerController(ctrl);
    inst.notifyPlaying("drive");
    inst.setAction("move-up", true);
    inst.setAction("move-up", true);
    inst.setAction("move-up", false);
    inst.setAction("dash", true);
    expect(ctrl.onAction).toHaveBeenCalledTimes(2);
    expect(ctrl.onAction).toHaveBeenNthCalledWith(1, "move-up");
    expect(ctrl.onAction).toHaveBeenNthCalledWith(2, "dash");
  });

  it("鍵盤按下就送；按下又放開落在同一幀之間也不漏，Host 下一幀不重送", () => {
    const ctrl = controller();
    const inst = new OrangeExpressInstance({ kidsMode: true, reducedMotion: false });
    inst.registerController(ctrl);
    inst.notifyPlaying("drive");
    inst.pressKey("move-up");
    inst.setAction("move-up", false);
    expect(ctrl.onAction).toHaveBeenCalledTimes(1);

    inst.pressKey("move-up");
    inst.setAction("move-up", true);
    inst.setAction("move-up", true);
    expect(ctrl.onAction).toHaveBeenCalledTimes(2);

    inst.setAction("move-up", false);
    inst.pressKey("move-up");
    inst.releaseKey("move-up");
    inst.pressKey("move-up");
    expect(ctrl.onAction).toHaveBeenCalledTimes(4);

    inst.releaseKey("move-up");
    inst.pause();
    inst.setAction("move-up", false);
    inst.pressKey("move-up");
    expect(ctrl.onAction).toHaveBeenCalledTimes(4);
  });

  it("結算只回報一次，並帶上這一檔", () => {
    const onSession = vi.fn();
    const inst = new OrangeExpressInstance({
      kidsMode: true,
      reducedMotion: false,
      onSession,
    });
    const run = finishLook();
    inst.notifyPlaying("look");
    inst.notifyWon(run);
    inst.notifyWon(run);
    expect(onSession).toHaveBeenCalledTimes(1);
    expect(onSession.mock.calls[0]?.[0]).toMatchObject({
      gameId: "orange-express",
      score: 0,
      levelIndex: 0,
      orangeExpressLevel: "look",
      cleared: true,
      flawless: true,
      collectedAll: true,
    });
  });

  it("慢慢看提早開門只在當下提醒，還是停得很漂亮", () => {
    const onSession = vi.fn();
    const inst = new OrangeExpressInstance({
      kidsMode: true,
      reducedMotion: false,
      onSession,
    });
    inst.notifyPlaying("look");
    inst.noteEarlyDoor();
    inst.notifyWon(finishLook());
    expect(onSession.mock.calls[0]?.[0]).toMatchObject({
      cleared: true,
      flawless: true,
      collectedAll: true,
    });
  });

  it("小站長提早開門就拿不到停得很漂亮", () => {
    const onSession = vi.fn();
    const inst = new OrangeExpressInstance({
      kidsMode: false,
      reducedMotion: false,
      onSession,
    });
    const run = createRun("captain");
    inst.notifyPlaying("captain");
    inst.noteEarlyDoor();
    inst.notifyWon({ ...run, phase: "route-done", grades: run.stations.map(() => "green" as const) });
    expect(onSession.mock.calls[0]?.[0]).toMatchObject({
      cleared: true,
      flawless: false,
      collectedAll: true,
    });
  });
});

describe("小橘特快車再玩一輪的星星", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
      clear: () => store.clear(),
    };
    vi.stubGlobal("window", {
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      localStorage: storage,
    });
    vi.stubGlobal("localStorage", storage);
  });

  it("第二輪補上漂亮停，不會把已經拿到的星再發一次", () => {
    const first = reportGameSession({
      gameId: "orange-express",
      score: 0,
      levelIndex: 0,
      orangeExpressLevel: "look",
      cleared: true,
      flawless: false,
      collectedAll: true,
    });
    const before = getLifetimeStars(first);
    const second = reportGameSession({
      gameId: "orange-express",
      score: 0,
      levelIndex: 0,
      orangeExpressLevel: "look",
      cleared: true,
      flawless: true,
      collectedAll: true,
    });
    expect(getLifetimeStars(second) - before).toBe(1);
    expect(second.medals["orange-express"]?.[0]).toBe(7);
    expect(second.stickers.filter((id) => id === "played-orange-express")).toHaveLength(1);
  });
});
