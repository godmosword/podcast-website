// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Reaction } from "@/lib/games/dino-sushi/reactions";
import { SPEECH_LANG, SPEECH_PITCH, SPEECH_RATE, VOICE_MUTE_STORAGE_KEY } from "@/lib/games/dino-sushi/speech";
import { useDinoSushiSpeech } from "./useDinoSushiSpeech";

class FakeUtterance {
  lang = "";
  rate = 1;
  pitch = 1;
  constructor(public text: string) {}
}

const speak = vi.fn();
const cancel = vi.fn();

function installSpeech() {
  vi.stubGlobal("speechSynthesis", { speak, cancel });
  vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);
}

const look: Reaction = { mood: "look", line: "還想要蟹肉棒！", sfx: "look", eats: false, brush: false };

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

beforeEach(() => {
  speak.mockClear();
  cancel.mockClear();
  installSpeech();
});

describe("useDinoSushiSpeech", () => {
  it("新訂單出現時用 zh-TW 念出來", () => {
    renderHook(() =>
      useDinoSushiSpeech({
        orderToken: "order:7:0",
        orderLine: "我想要蟹肉棒手捲",
        caption: null,
        inputPaused: false,
      }),
    );
    expect(speak).toHaveBeenCalledTimes(1);
    const utter = speak.mock.calls[0]![0] as FakeUtterance;
    expect(utter.text).toBe("我想要蟹肉棒手捲");
    expect(utter.lang).toBe(SPEECH_LANG);
    expect(utter.rate).toBe(SPEECH_RATE);
    expect(utter.pitch).toBe(SPEECH_PITCH);
  });

  it("換單先取消上一句，再念新的", () => {
    const { rerender } = renderHook(
      (token: string) =>
        useDinoSushiSpeech({
          orderToken: token,
          orderLine: token === "a" ? "我想要蟹肉棒手捲" : "我想要鮭魚手捲",
          caption: null,
          inputPaused: false,
        }),
      { initialProps: "a" },
    );
    expect(speak).toHaveBeenCalledTimes(1);
    rerender("b");
    expect(cancel).toHaveBeenCalled();
    expect(speak).toHaveBeenCalledTimes(2);
    expect((speak.mock.calls[1]![0] as FakeUtterance).text).toBe("我想要鮭魚手捲");
  });

  it("多多的字卡出現時念字卡", () => {
    const { rerender } = renderHook(
      (caption: Reaction | null) =>
        useDinoSushiSpeech({
          orderToken: "order:7:0",
          orderLine: "我想要蟹肉棒手捲",
          caption,
          inputPaused: false,
        }),
      { initialProps: null as Reaction | null },
    );
    speak.mockClear();
    cancel.mockClear();
    rerender(look);
    expect(speak).toHaveBeenCalledTimes(1);
    expect((speak.mock.calls[0]![0] as FakeUtterance).text).toBe("還想要蟹肉棒！");
  });

  it("卸載時取消還沒念完的", () => {
    const { unmount } = renderHook(() =>
      useDinoSushiSpeech({
        orderToken: "order:7:0",
        orderLine: "我想要蟹肉棒手捲",
        caption: null,
        inputPaused: false,
      }),
    );
    cancel.mockClear();
    unmount();
    expect(cancel).toHaveBeenCalled();
  });

  it("靜音記在 localStorage，關掉時取消，再聽一次也不出聲", () => {
    const { result } = renderHook(() =>
      useDinoSushiSpeech({
        orderToken: "order:7:0",
        orderLine: "我想要蟹肉棒手捲",
        caption: null,
        inputPaused: false,
      }),
    );
    expect(result.current.muted).toBe(false);
    act(() => result.current.toggleMuted());
    expect(result.current.muted).toBe(true);
    expect(window.localStorage.getItem(VOICE_MUTE_STORAGE_KEY)).toBe("off");
    expect(cancel).toHaveBeenCalled();
    speak.mockClear();
    act(() => result.current.replay());
    expect(speak).not.toHaveBeenCalled();
  });

  it("已經靜音時，新訂單不念；打開後再聽一次會念", () => {
    window.localStorage.setItem(VOICE_MUTE_STORAGE_KEY, "off");
    const { result } = renderHook(() =>
      useDinoSushiSpeech({
        orderToken: "order:7:0",
        orderLine: "我想要蟹肉棒手捲",
        caption: null,
        inputPaused: false,
      }),
    );
    expect(result.current.muted).toBe(true);
    expect(speak).not.toHaveBeenCalled();
    act(() => result.current.toggleMuted());
    act(() => result.current.replay());
    expect(speak).toHaveBeenCalledTimes(1);
    expect((speak.mock.calls[0]![0] as FakeUtterance).text).toBe("我想要蟹肉棒手捲");
  });

  it("沒有 speechSynthesis 時不丟錯", () => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(window, "speechSynthesis");
    Reflect.deleteProperty(window, "SpeechSynthesisUtterance");
    expect(() =>
      renderHook(() =>
        useDinoSushiSpeech({
          orderToken: "order:7:0",
          orderLine: "我想要蟹肉棒手捲",
          caption: null,
          inputPaused: false,
        }),
      ),
    ).not.toThrow();
  });

  it("暫停時取消朗讀", () => {
    const { rerender } = renderHook(
      (paused: boolean) =>
        useDinoSushiSpeech({
          orderToken: "order:7:0",
          orderLine: "我想要蟹肉棒手捲",
          caption: null,
          inputPaused: paused,
        }),
      { initialProps: false },
    );
    cancel.mockClear();
    rerender(true);
    expect(cancel).toHaveBeenCalled();
  });
});
