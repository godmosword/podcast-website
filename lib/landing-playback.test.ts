import { afterEach, describe, expect, it, vi } from "vitest";
import {
  beginLandingPlayback,
  cancelLandingPlayback,
  takeLandingPlayback,
} from "./landing-playback";

class FakeAudio {
  src: string;
  preload = "";
  paused = true;
  play = vi.fn(async () => {
    this.paused = false;
  });
  pause = vi.fn(() => {
    this.paused = true;
  });
  removeAttribute = vi.fn();
  load = vi.fn();

  constructor(src: string) {
    this.src = src;
  }
}

describe("landing playback handoff", () => {
  afterEach(() => {
    cancelLandingPlayback();
    vi.unstubAllGlobals();
  });

  it("在 click 路徑啟播並由相同故事的播放器接管", async () => {
    vi.stubGlobal("Audio", FakeAudio);
    await beginLandingPlayback("ep-18", "/stories/ep-18/audio.mp3");

    const audio = takeLandingPlayback("ep-18") as unknown as FakeAudio;
    expect(audio).toBeInstanceOf(FakeAudio);
    expect(audio.preload).toBe("auto");
    expect(audio.play).toHaveBeenCalledOnce();
    expect(audio.paused).toBe(false);
    expect(takeLandingPlayback("ep-18")).toBeNull();
  });

  it("不把音訊交給錯誤故事", async () => {
    vi.stubGlobal("Audio", FakeAudio);
    await beginLandingPlayback("ep-18", "/stories/ep-18/audio.mp3");
    expect(takeLandingPlayback("ep-17")).toBeNull();
    expect(takeLandingPlayback("ep-18")).not.toBeNull();
  });
});
