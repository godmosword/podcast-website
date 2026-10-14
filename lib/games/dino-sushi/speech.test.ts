import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cancelSpeech,
  clearLegacyVoiceSetting,
  isSpeaking,
  LEGACY_VOICE_MUTE_STORAGE_KEY,
  SPEECH_LANG,
  SPEECH_PITCH,
  SPEECH_RATE,
  speakText,
} from "./speech";

class FakeUtterance {
  lang = "";
  rate = 1;
  pitch = 1;
  volume = 1;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public text: string) {}
}

/** 像瀏覽器一樣：speak 後 speaking=true，念完呼叫 onend；cancel 清空。 */
function fakeSynth() {
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
    /** 念完正在念的那一句。 */
    finish() {
      const u = synth.spoken.at(-1)!;
      synth.speaking = false;
      u.onend?.();
    },
  };
  vi.stubGlobal("window", { speechSynthesis: synth, SpeechSynthesisUtterance: FakeUtterance });
  return synth;
}

afterEach(() => {
  cancelSpeech();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("壽司屋朗讀（沒有瀏覽器語音時）", () => {
  it("SSR：沒有 window 時不丟錯", () => {
    expect(typeof window).toBe("undefined");
    expect(() => speakText("我想要鮭魚和玉子握壽司")).not.toThrow();
    expect(() => cancelSpeech()).not.toThrow();
    expect(isSpeaking("我想要鮭魚和玉子握壽司")).toBe(false);
    expect(() => clearLegacyVoiceSetting()).not.toThrow();
  });

  it("speechSynthesis 不完整時不丟錯", () => {
    vi.stubGlobal("window", { speechSynthesis: {} });
    expect(() => speakText("我想要蟹肉棒手捲")).not.toThrow();
    expect(() => cancelSpeech()).not.toThrow();
  });
});

describe("壽司屋朗讀（有 Web Speech）", () => {
  it("用 zh-TW、稍慢、較高音調；預設插隊，正在念的先取消，沒在念就不 cancel", () => {
    const synth = fakeSynth();
    speakText("我想要鮭魚和玉子握壽司");
    expect(synth.cancel).not.toHaveBeenCalled();
    speakText("我想要鮭魚和玉子握壽司");
    expect(synth.cancel).toHaveBeenCalledTimes(1);
    expect(synth.speak).toHaveBeenCalledTimes(2);
    const utter = synth.spoken[0]!;
    expect(utter.text).toBe("我想要鮭魚和玉子握壽司");
    expect(utter.lang).toBe(SPEECH_LANG);
    expect(utter.lang).toBe("zh-TW");
    expect(utter.rate).toBe(SPEECH_RATE);
    expect(utter.rate).toBe(0.9);
    expect(utter.pitch).toBe(SPEECH_PITCH);
    expect(utter.pitch).toBeGreaterThan(1);
    expect(utter.volume).toBe(1);
  });

  it("音量跟遊戲音量；0 不念", () => {
    const synth = fakeSynth();
    speakText("好好吃！", { volume: 0.4 });
    expect(synth.spoken[0]!.volume).toBe(0.4);
    speakText("好好吃！", { volume: 0 });
    expect(synth.speak).toHaveBeenCalledTimes(1);
  });

  it("排隊：正在念時不打斷，念完才接著念", () => {
    const synth = fakeSynth();
    speakText("蟹肉棒，好好吃！", { interrupt: false });
    speakText("我想要鮭魚手捲", { interrupt: false });
    expect(synth.speak).toHaveBeenCalledTimes(1);
    expect(synth.cancel).not.toHaveBeenCalled();
    synth.finish();
    expect(synth.speak).toHaveBeenCalledTimes(2);
    expect(synth.spoken[1]!.text).toBe("我想要鮭魚手捲");
  });

  it("排隊只留最新一句，舊的丟掉", () => {
    const synth = fakeSynth();
    speakText("蟹肉棒，好好吃！", { interrupt: false });
    speakText("我想要鮭魚手捲", { interrupt: false });
    speakText("還想要鮭魚！", { interrupt: false });
    synth.finish();
    synth.finish();
    expect(synth.spoken.map((u) => u.text)).toEqual(["蟹肉棒，好好吃！", "還想要鮭魚！"]);
  });

  it("插隊會清掉排隊的那句", () => {
    const synth = fakeSynth();
    speakText("蟹肉棒，好好吃！", { interrupt: false });
    speakText("我想要鮭魚手捲", { interrupt: false });
    speakText("我想要玉米軍艦");
    synth.finish();
    expect(synth.spoken.map((u) => u.text)).toEqual(["蟹肉棒，好好吃！", "我想要玉米軍艦"]);
  });

  it("被取消的舊句子晚到的 onend 不會接著念", () => {
    const synth = fakeSynth();
    speakText("蟹肉棒，好好吃！", { interrupt: false });
    const old = synth.spoken[0]!;
    speakText("我想要鮭魚手捲", { interrupt: false });
    cancelSpeech();
    old.onend?.();
    expect(synth.speak).toHaveBeenCalledTimes(1);
  });

  it("瀏覽器說沒在念（例如 iOS 沒手勢時根本沒開始），排隊不會卡住", () => {
    const synth = fakeSynth();
    speakText("我想要鮭魚手捲", { interrupt: false });
    synth.speaking = false;
    speakText("蟹肉棒，好好吃！", { interrupt: false });
    expect(synth.speak).toHaveBeenCalledTimes(2);
  });

  it("onend 遺失、瀏覽器一直說在念：過了時限就不再排隊，點泡泡也能插隊", () => {
    const now = vi.spyOn(Date, "now").mockReturnValue(1_000_000);
    const synth = fakeSynth();
    speakText("我想要鮭魚手捲");
    expect(isSpeaking("我想要鮭魚手捲")).toBe(true);
    speakText("蟹肉棒，好好吃！", { interrupt: false });
    expect(synth.speak).toHaveBeenCalledTimes(1);
    now.mockReturnValue(1_000_000 + 2000 + "我想要鮭魚手捲".length * 400 + 1);
    expect(isSpeaking("我想要鮭魚手捲")).toBe(false);
    speakText("我想要玉米軍艦", { interrupt: false });
    expect(synth.spoken.map((u) => u.text)).toEqual(["我想要鮭魚手捲", "我想要玉米軍艦"]);
  });

  it("isSpeaking 只在那一句還在念時為真", () => {
    const synth = fakeSynth();
    speakText("我想要鮭魚手捲");
    expect(isSpeaking("我想要鮭魚手捲")).toBe(true);
    expect(isSpeaking("我想要玉米軍艦")).toBe(false);
    synth.finish();
    expect(isSpeaking("我想要鮭魚手捲")).toBe(false);
  });

  it("空字串不呼叫語音", () => {
    const synth = fakeSynth();
    speakText("");
    expect(synth.speak).not.toHaveBeenCalled();
  });

  it("speak 丟錯時吞掉，不讓遊戲中斷", () => {
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
    expect(() => speakText("好好吃！", { interrupt: false })).not.toThrow();
  });
});

describe("舊的朗讀靜音值", () => {
  it("清掉 #215 的 key", () => {
    const removeItem = vi.fn();
    vi.stubGlobal("window", { localStorage: { removeItem } });
    clearLegacyVoiceSetting();
    expect(removeItem).toHaveBeenCalledWith(LEGACY_VOICE_MUTE_STORAGE_KEY);
    expect(LEGACY_VOICE_MUTE_STORAGE_KEY).toBe("cheche:dino-sushi-voice");
  });

  it("localStorage 丟錯時不爆", () => {
    vi.stubGlobal("window", {
      localStorage: {
        removeItem: () => {
          throw new Error("blocked");
        },
      },
    });
    expect(() => clearLegacyVoiceSetting()).not.toThrow();
  });
});
