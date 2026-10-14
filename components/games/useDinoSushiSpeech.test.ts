// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Reaction } from "@/lib/games/dino-sushi/reactions";
import { cancelSpeech, LEGACY_VOICE_MUTE_STORAGE_KEY, SPEECH_LANG, SPEECH_PITCH, SPEECH_RATE } from "@/lib/games/shared/speech";
import { useDinoSushiSpeech } from "./useDinoSushiSpeech";

class FakeUtterance {
  lang = "";
  rate = 1;
  pitch = 1;
  volume = 1;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public text: string) {}
}

/** 像瀏覽器一樣：speak 後 speaking=true，finish() 念完並觸發 onend；cancel 清空。 */
const synth = {
  speaking: false,
  pending: false,
  spoken: [] as FakeUtterance[],
  speak: vi.fn((u: FakeUtterance) => {
    synth.spoken.push(u);
    synth.speaking = true;
  }),
  cancel: vi.fn(() => {
    synth.speaking = false;
  }),
  finish() {
    synth.speaking = false;
    synth.spoken.at(-1)?.onend?.();
  },
};

const texts = () => synth.spoken.map((u) => u.text);

const look: Reaction = { mood: "look", line: "還想要蟹肉棒！", sfx: "look", eats: false, brush: false };
const yum: Reaction = { mood: "yum", line: "蟹肉棒，好好吃！", sfx: "yum", eats: true, brush: false };

type Props = Parameters<typeof useDinoSushiSpeech>[0];

const base: Props = {
  orderToken: "order:7:1",
  orderLine: "我想要蟹肉棒手捲",
  firstOrder: false,
  caption: null,
  inputPaused: false,
  soundOn: true,
  volume: 1,
  voiceEnabled: true,
};

function render(initial: Partial<Props> = {}) {
  return renderHook((props: Props) => useDinoSushiSpeech(props), { initialProps: { ...base, ...initial } });
}

afterEach(() => {
  cleanup();
  cancelSpeech();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

beforeEach(() => {
  synth.speaking = false;
  synth.spoken = [];
  synth.speak.mockClear();
  synth.cancel.mockClear();
  vi.stubGlobal("speechSynthesis", synth);
  vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);
});

describe("useDinoSushiSpeech", () => {
  it("新訂單出現時用 zh-TW 念出來", () => {
    render();
    expect(texts()).toEqual(["我想要蟹肉棒手捲"]);
    const utter = synth.spoken[0]!;
    expect(utter.lang).toBe(SPEECH_LANG);
    expect(utter.rate).toBe(SPEECH_RATE);
    expect(utter.pitch).toBe(SPEECH_PITCH);
  });

  it("換單不切掉正在念的字卡：念完字卡才念下一單", () => {
    const { rerender } = render({ caption: null });
    synth.finish();
    rerender({ ...base, caption: yum });
    expect(texts().at(-1)).toBe("蟹肉棒，好好吃！");
    synth.cancel.mockClear();
    rerender({ ...base, orderToken: "order:7:2", orderLine: "我想要鮭魚手捲", caption: null });
    expect(synth.cancel).not.toHaveBeenCalled();
    expect(texts().at(-1)).toBe("蟹肉棒，好好吃！");
    synth.finish();
    expect(texts().at(-1)).toBe("我想要鮭魚手捲");
  });

  it("一輪的第一單插隊：上一輪還沒念完的直接停", () => {
    const { rerender } = render({ caption: yum });
    synth.cancel.mockClear();
    rerender({ ...base, orderToken: "order:9:0", orderLine: "我想要玉米軍艦", firstOrder: true, caption: null });
    expect(synth.cancel).toHaveBeenCalled();
    expect(texts().at(-1)).toBe("我想要玉米軍艦");
  });

  it("多多的字卡出現時念字卡", () => {
    const { rerender } = render();
    synth.finish();
    rerender({ ...base, caption: look });
    expect(texts().at(-1)).toBe("還想要蟹肉棒！");
  });

  it("卸載時取消還沒念完的", () => {
    const { unmount } = render();
    synth.cancel.mockClear();
    unmount();
    expect(synth.cancel).toHaveBeenCalled();
  });

  it("抬頭音效關著：不念、點泡泡也不念，voiceOn 為 false", () => {
    const { result } = render({ soundOn: false });
    expect(synth.speak).not.toHaveBeenCalled();
    expect(result.current.voiceOn).toBe(false);
    act(() => result.current.replay());
    expect(synth.speak).not.toHaveBeenCalled();
  });

  it("設定裡關掉念出來：音效開著也不念、點泡泡不念，voiceOn 為 false", () => {
    const { result } = render({ voiceEnabled: false });
    expect(synth.speak).not.toHaveBeenCalled();
    expect(result.current.voiceOn).toBe(false);
    act(() => result.current.replay());
    expect(synth.speak).not.toHaveBeenCalled();
  });

  it("念到一半在設定裡關掉念出來：馬上停", () => {
    const { rerender } = render();
    synth.cancel.mockClear();
    rerender({ ...base, voiceEnabled: false });
    expect(synth.cancel).toHaveBeenCalled();
  });

  it("念到一半關掉抬頭音效：馬上停", () => {
    const { rerender } = render();
    synth.cancel.mockClear();
    rerender({ ...base, soundOn: false });
    expect(synth.cancel).toHaveBeenCalled();
  });

  it("遊戲音量 0 等於關；其他音量照設定", () => {
    const { result } = render({ volume: 0 });
    expect(synth.speak).not.toHaveBeenCalled();
    expect(result.current.voiceOn).toBe(false);
    cleanup();
    render({ volume: 0.5 });
    expect(synth.spoken.at(-1)!.volume).toBe(0.5);
  });

  it("改音量、重開音效都不會把這一單重念一次", () => {
    const { rerender } = render();
    synth.finish();
    rerender({ ...base, volume: 0.6 });
    rerender({ ...base, soundOn: false });
    rerender({ ...base, soundOn: true });
    expect(synth.speak).toHaveBeenCalledTimes(1);
  });

  it("點泡泡再聽一次：插隊重念；同一句正在念時連點不從頭念", () => {
    const { result, rerender } = render();
    act(() => result.current.replay());
    expect(synth.speak).toHaveBeenCalledTimes(1);
    synth.finish();
    rerender({ ...base, caption: look });
    act(() => result.current.replay());
    expect(texts().at(-1)).toBe("我想要蟹肉棒手捲");
    expect(synth.speak).toHaveBeenCalledTimes(3);
  });

  it("StrictMode 開發模式雙跑 effect 時，第一單仍然有念", () => {
    renderHook(() => useDinoSushiSpeech({ ...base, orderToken: "order:7:0", firstOrder: true }), { wrapper: StrictMode });
    const lastSpeak = Math.max(...synth.speak.mock.invocationCallOrder);
    const lastCancel = Math.max(0, ...synth.cancel.mock.invocationCallOrder);
    expect(lastSpeak).toBeGreaterThan(lastCancel);
    expect(texts().at(-1)).toBe("我想要蟹肉棒手捲");
  });

  it("沒有 speechSynthesis 時不丟錯", () => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(window, "speechSynthesis");
    Reflect.deleteProperty(window, "SpeechSynthesisUtterance");
    expect(() => render()).not.toThrow();
  });

  it("暫停時取消朗讀", () => {
    const { rerender } = render();
    synth.cancel.mockClear();
    rerender({ ...base, inputPaused: true });
    expect(synth.cancel).toHaveBeenCalled();
  });

  it("清掉 #215 獨立朗讀靜音留下的值", () => {
    window.localStorage.setItem(LEGACY_VOICE_MUTE_STORAGE_KEY, "off");
    render();
    expect(window.localStorage.getItem(LEGACY_VOICE_MUTE_STORAGE_KEY)).toBeNull();
    expect(texts()).toEqual(["我想要蟹肉棒手捲"]);
  });
});
