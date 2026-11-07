// @vitest-environment jsdom
import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BASE_FLY_TOTAL_MS } from "./useBaseFly";
import { useRevealTray } from "./useRevealTray";

const rect = (top: number, bottom: number) => ({ top, bottom, height: bottom - top }) as DOMRect;

/** 假廚房：多多頂端在 duoTop、托盤底超出螢幕，抬頭底固定 72（jsdom 沒有版面，全部給定）。 */
function kitchen(duoTop: number) {
  const root = document.createElement("div");
  root.innerHTML = '<span data-face="idle"></span><div data-role="talk"></div><div data-role="tray"></div>';
  root.querySelector("[data-face]")!.getBoundingClientRect = () => rect(duoTop, duoTop + 100);
  root.querySelector('[data-role="talk"]')!.getBoundingClientRect = () => rect(172, 214);
  root.querySelector('[data-role="tray"]')!.getBoundingClientRect = () => rect(500, 700);
  const header = document.createElement("header");
  header.innerHTML = '<h1 id="game-play-title"></h1>';
  header.getBoundingClientRect = () => rect(0, 72);
  document.body.append(header, root);
  return root;
}

type Props = { choosingBase: boolean; eating: boolean; inputPaused: boolean; reducedMotion?: boolean };

function setup(duoTop: number, initial: Props) {
  const root = kitchen(duoTop);
  return renderHook(
    (props: Props) =>
      useRevealTray({
        rootRef: { current: root },
        choosingBase: props.choosingBase,
        eating: props.eating,
        reducedMotion: props.reducedMotion ?? false,
        inputPaused: props.inputPaused,
      }),
    { initialProps: initial },
  );
}

const scrollBy = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  scrollBy.mockReset();
  window.scrollBy = scrollBy as unknown as typeof window.scrollBy;
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  Object.defineProperty(window, "innerHeight", { configurable: true, value: 553 });
});

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
  vi.useRealTimers();
});

const idle: Props = { choosingBase: true, eating: false, inputPaused: false };

describe("送出時讓多多的臉進畫面", () => {
  it("臉被抬頭蓋住：吃的那一刻就往上捲", () => {
    const { rerender } = setup(15, { ...idle, choosingBase: false });
    expect(scrollBy).not.toHaveBeenCalled();
    rerender({ ...idle, choosingBase: false, eating: true });
    expect(scrollBy).toHaveBeenCalledTimes(1);
    const arg = scrollBy.mock.calls[0]![0] as ScrollToOptions;
    expect(arg.top!).toBeLessThan(0);
    expect(arg.behavior).toBe("smooth");
  });

  it("臉看得到：不動", () => {
    const { rerender } = setup(120, { ...idle, choosingBase: false });
    rerender({ ...idle, choosingBase: false, eating: true });
    expect(scrollBy).not.toHaveBeenCalled();
  });

  it("減少動態：瞬間捲", () => {
    const { rerender } = setup(15, { ...idle, choosingBase: false, reducedMotion: true });
    rerender({ ...idle, choosingBase: false, eating: true, reducedMotion: true });
    expect((scrollBy.mock.calls[0]![0] as ScrollToOptions).behavior).toBe("instant");
  });

  it("選完飯馬上送出：還沒執行的托盤下捲取消，不會在吃的時候把多多捲走", () => {
    const { rerender } = setup(120, idle);
    rerender({ ...idle, choosingBase: false });
    vi.advanceTimersByTime(BASE_FLY_TOTAL_MS / 2);
    rerender({ ...idle, choosingBase: false, eating: true });
    vi.advanceTimersByTime(BASE_FLY_TOTAL_MS * 2);
    expect(scrollBy.mock.calls.filter(([arg]) => (arg as ScrollToOptions).top! > 0)).toHaveLength(0);
  });

  it("沒有馬上送出：托盤照樣捲進來", () => {
    const { rerender } = setup(120, idle);
    rerender({ ...idle, choosingBase: false });
    vi.advanceTimersByTime(BASE_FLY_TOTAL_MS + 20);
    expect(scrollBy.mock.calls.filter(([arg]) => (arg as ScrollToOptions).top! > 0)).toHaveLength(1);
  });

  it("暫停時不捲；繼續時還在吃、臉仍被蓋，要補捲", () => {
    const { rerender } = setup(15, { ...idle, choosingBase: false, inputPaused: true });
    rerender({ ...idle, choosingBase: false, eating: true, inputPaused: true });
    expect(scrollBy).not.toHaveBeenCalled();
    rerender({ ...idle, choosingBase: false, eating: true, inputPaused: false });
    expect(scrollBy).toHaveBeenCalledTimes(1);
  });
});
