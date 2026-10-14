import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cancelSpeech,
  readVoiceMuted,
  SPEECH_LANG,
  SPEECH_PITCH,
  SPEECH_RATE,
  speakText,
  VOICE_MUTE_STORAGE_KEY,
  writeVoiceMuted,
} from "./speech";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("壽司屋朗讀（沒有瀏覽器語音時）", () => {
  it("SSR：沒有 window 時不丟錯、也不當靜音", () => {
    expect(typeof window).toBe("undefined");
    expect(() => speakText("我想要鮭魚和玉子握壽司")).not.toThrow();
    expect(() => cancelSpeech()).not.toThrow();
    expect(readVoiceMuted()).toBe(false);
    expect(() => writeVoiceMuted(true)).not.toThrow();
  });

  it("speechSynthesis 不完整時不丟錯", () => {
    vi.stubGlobal("window", {
      speechSynthesis: {},
      localStorage: { getItem: () => null, setItem: () => undefined },
    });
    expect(() => speakText("我想要蟹肉棒手捲")).not.toThrow();
    expect(() => cancelSpeech()).not.toThrow();
  });
});

describe("壽司屋朗讀（有 Web Speech）", () => {
  it("用 zh-TW、稍慢、較高音調，新的一句先取消上一句", () => {
    const speak = vi.fn();
    const cancel = vi.fn();
    class FakeUtterance {
      lang = "";
      rate = 1;
      pitch = 1;
      constructor(public text: string) {}
    }
    vi.stubGlobal("window", {
      speechSynthesis: { speak, cancel },
      SpeechSynthesisUtterance: FakeUtterance,
    });

    speakText("我想要鮭魚和玉子握壽司");

    expect(cancel).toHaveBeenCalledTimes(1);
    expect(speak).toHaveBeenCalledTimes(1);
    const utter = speak.mock.calls[0]![0] as FakeUtterance;
    expect(utter.text).toBe("我想要鮭魚和玉子握壽司");
    expect(utter.lang).toBe(SPEECH_LANG);
    expect(utter.lang).toBe("zh-TW");
    expect(utter.rate).toBe(SPEECH_RATE);
    expect(utter.rate).toBe(0.9);
    expect(utter.pitch).toBe(SPEECH_PITCH);
    expect(utter.pitch).toBeGreaterThan(1);

    cancelSpeech();
    expect(cancel).toHaveBeenCalledTimes(2);
  });

  it("空字串不呼叫語音", () => {
    const speak = vi.fn();
    vi.stubGlobal("window", {
      speechSynthesis: { speak, cancel: vi.fn() },
      SpeechSynthesisUtterance: class {},
    });
    speakText("");
    expect(speak).not.toHaveBeenCalled();
  });

  it("speak 丟錯時吞掉，不讓遊戲中斷", () => {
    class FakeUtterance {
      lang = "";
      rate = 1;
      pitch = 1;
      constructor(public text: string) {}
    }
    vi.stubGlobal("window", {
      speechSynthesis: {
        cancel: vi.fn(),
        speak: () => {
          throw new Error("no voice");
        },
      },
      SpeechSynthesisUtterance: FakeUtterance,
    });
    expect(() => speakText("好好吃！")).not.toThrow();
  });
});

describe("朗讀靜音", () => {
  it("寫進 localStorage，讀回來", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value);
        },
      },
    });
    expect(readVoiceMuted()).toBe(false);
    writeVoiceMuted(true);
    expect(store.get(VOICE_MUTE_STORAGE_KEY)).toBe("off");
    expect(readVoiceMuted()).toBe(true);
    writeVoiceMuted(false);
    expect(store.get(VOICE_MUTE_STORAGE_KEY)).toBe("on");
    expect(readVoiceMuted()).toBe(false);
  });

  it("localStorage 丟錯時不爆", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => {
          throw new Error("blocked");
        },
        setItem: () => {
          throw new Error("blocked");
        },
      },
    });
    expect(readVoiceMuted()).toBe(false);
    expect(() => writeVoiceMuted(true)).not.toThrow();
  });
});
