import { describe, expect, it, vi } from "vitest";
import { announce, nextStationAnnouncement } from "@/lib/games/orange-express/announce";

const SLOPE = { id: "orange-slope", name: "橘子坡" } as const;

describe("車內廣播", () => {
  it("下一站，○○站", () => {
    expect(nextStationAnnouncement(SLOPE)).toEqual({ id: "next-orange-slope", text: "下一站，橘子坡站" });
  });

  it("沒有錄音時用朗讀；有錄音時改播錄音", () => {
    const speak = vi.fn();
    const playClip = vi.fn(() => true);
    const item = nextStationAnnouncement(SLOPE);
    expect(announce(item, 0.8, { speak, playClip, canSpeak: () => true, clips: {} })).toBe("tts");
    expect(speak).toHaveBeenCalledWith("下一站，橘子坡站", { interrupt: true, volume: 0.8 });
    expect(playClip).not.toHaveBeenCalled();

    speak.mockClear();
    const clips = { "next-orange-slope": "/games/v2/orange-express/voice/next-orange-slope.m4a" };
    expect(announce(item, 0.8, { speak, playClip, canSpeak: () => true, clips })).toBe("clip");
    expect(playClip).toHaveBeenCalledWith(clips["next-orange-slope"], 0.8, expect.any(Function));
    expect(speak).not.toHaveBeenCalled();
  });

  it("錄音播不起來時退回朗讀", () => {
    const speak = vi.fn();
    const item = nextStationAnnouncement(SLOPE);
    const playClip = vi.fn((_url: string, _volume: number, onFail: () => void) => {
      onFail();
      return true;
    });
    announce(item, 1, { speak, playClip, canSpeak: () => true, clips: { [item.id]: "/x.m4a" } });
    expect(speak).toHaveBeenCalledTimes(1);
  });

  it("沒有朗讀、或音量是 0：安靜略過", () => {
    const speak = vi.fn();
    const item = nextStationAnnouncement(SLOPE);
    expect(announce(item, 1, { speak, canSpeak: () => false, clips: {} })).toBe("silent");
    expect(announce(item, 0, { speak, canSpeak: () => true, clips: {} })).toBe("silent");
    expect(speak).not.toHaveBeenCalled();
  });

  it("瀏覽器沒有 speechSynthesis 時不丟錯", () => {
    expect(() => announce(nextStationAnnouncement(SLOPE), 1)).not.toThrow();
  });
});
