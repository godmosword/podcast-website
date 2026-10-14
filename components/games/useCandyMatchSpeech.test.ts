// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cancelSpeech, LEGACY_VOICE_MUTE_STORAGE_KEY, SPEECH_LANG, SPEECH_PITCH, SPEECH_RATE } from "@/lib/games/shared/speech";
import { setSfxEnabled } from "@/lib/sfx";
import type { CandySpeechCue } from "./useCandyMatchPlay";
import { useCandyMatchSpeech } from "./useCandyMatchSpeech";

class FakeUtterance {
  lang = "";
  rate = 1;
  pitch = 1;
  volume = 1;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public text: string) {}
}

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

const goal: CandySpeechCue = { seq: 1, text: "收集計程車 30 個，還要啟動特殊糖 2 次。", interrupt: true };

type Props = Parameters<typeof useCandyMatchSpeech>[0];

const base: Props = {
  active: true,
  cue: goal,
  inputPaused: false,
  soundOn: true,
  volume: 1,
  voiceEnabled: true,
};

function render(initial: Partial<Props> = {}) {
  return renderHook((props: Props) => useCandyMatchSpeech(props), { initialProps: { ...base, ...initial } });
}

afterEach(() => {
  cleanup();
  cancelSpeech();
  setSfxEnabled(true);
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

describe("useCandyMatchSpeech", () => {
  it("開局目標用 zh-TW 念出來", () => {
    render();
    expect(texts()).toEqual([goal.text]);
    const utter = synth.spoken[0]!;
    expect(utter.lang).toBe(SPEECH_LANG);
    expect(utter.rate).toBe(SPEECH_RATE);
    expect(utter.pitch).toBe(SPEECH_PITCH);
  });

  it("換關先取消上一句，再念新的目標", () => {
    const { rerender } = render();
    synth.cancel.mockClear();
    const next: CandySpeechCue = { seq: 2, text: "收集小紅、小巴士、鈴鈴各 33 個。", interrupt: true };
    rerender({ ...base, cue: next });
    expect(synth.cancel).toHaveBeenCalled();
    expect(texts().at(-1)).toBe(next.text);
  });

  it("鼓勵排在正在念的後面，不把目標切掉", () => {
    const { rerender } = render();
    const cheer: CandySpeechCue = { seq: 2, text: "好棒喔！", interrupt: false };
    rerender({ ...base, cue: cheer });
    expect(synth.cancel).not.toHaveBeenCalled();
    expect(texts()).toEqual([goal.text]);
    synth.finish();
    expect(texts().at(-1)).toBe("好棒喔！");
  });

  it("卸載時取消還沒念完的", () => {
    const { unmount } = render();
    synth.cancel.mockClear();
    unmount();
    expect(synth.cancel).toHaveBeenCalled();
  });

  it("離開局內時取消", () => {
    const { rerender } = render();
    synth.cancel.mockClear();
    rerender({ ...base, active: false });
    expect(synth.cancel).toHaveBeenCalled();
  });

  it("音效關著不念；再聽一次也不出聲", () => {
    const { result } = render({ soundOn: false });
    expect(synth.speak).not.toHaveBeenCalled();
    expect(result.current.muted).toBe(true);
    act(() => result.current.replay());
    expect(synth.speak).not.toHaveBeenCalled();
  });

  it("念到一半關掉朗讀：馬上停", () => {
    const { result } = render();
    synth.cancel.mockClear();
    act(() => result.current.toggleMuted());
    expect(synth.cancel).toHaveBeenCalled();
    expect(window.localStorage.getItem("cheche:progress")).toContain('"sfxEnabled":false');
  });

  it("設定裡關掉念出來：音效開著也不念，再聽一次、點目標卡都不出聲", () => {
    const { result } = render({ voiceEnabled: false });
    expect(synth.speak).not.toHaveBeenCalled();
    expect(result.current.voiceOn).toBe(false);
    act(() => result.current.replay());
    act(() => result.current.speak("收集計程車"));
    expect(synth.speak).not.toHaveBeenCalled();
  });

  it("念到一半在設定裡關掉念出來：馬上停，音效開關不動", () => {
    const { rerender } = render();
    synth.cancel.mockClear();
    rerender({ ...base, voiceEnabled: false });
    expect(synth.cancel).toHaveBeenCalled();
    expect(window.localStorage.getItem("cheche:progress") ?? "").not.toContain('"sfxEnabled":false');
  });

  it("遊戲音量 0 等於關", () => {
    const { result } = render({ volume: 0 });
    expect(synth.speak).not.toHaveBeenCalled();
    expect(result.current.voiceOn).toBe(false);
  });

  it("點目標卡會念指定的那一句", () => {
    const { result } = render();
    synth.finish();
    act(() => result.current.speak("還差 2 台小紅！"));
    expect(texts().at(-1)).toBe("還差 2 台小紅！");
  });

  it("再聽一次會插隊重念；同一句正在念時連點不從頭念", () => {
    const { result } = render();
    act(() => result.current.replay());
    expect(synth.speak).toHaveBeenCalledTimes(1);
    synth.finish();
    act(() => result.current.replay());
    expect(texts().at(-1)).toBe(goal.text);
    expect(synth.speak).toHaveBeenCalledTimes(2);
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

  it("清掉舊的獨立朗讀靜音", () => {
    window.localStorage.setItem(LEGACY_VOICE_MUTE_STORAGE_KEY, "off");
    render();
    expect(window.localStorage.getItem(LEGACY_VOICE_MUTE_STORAGE_KEY)).toBeNull();
  });
});
