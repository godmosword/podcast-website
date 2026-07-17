import { describe, expect, it, vi } from "vitest";
import { storyAudioPath, storyAudioUrl } from "./story-utils";

describe("story audio URL routing", () => {
  it("外部 origin 僅影響瀏覽器 URL，不影響 local filesystem path", () => {
    vi.stubEnv("NEXT_PUBLIC_AUDIO_BASE_URL", "https://audio.example.com/");

    expect(storyAudioUrl("ep-18", "audio.mp3")).toBe(
      "https://audio.example.com/stories/ep-18/audio.mp3",
    );
    expect(storyAudioPath("ep-18", "audio.mp3")).toBe(
      "/stories/ep-18/audio.mp3",
    );

    vi.unstubAllEnvs();
  });

  it("origin 無效時 fallback 到同網域 public 路徑", () => {
    vi.stubEnv("NEXT_PUBLIC_AUDIO_BASE_URL", "javascript:alert(1)");

    expect(storyAudioUrl("ep-1", "audio.mp3")).toBe(
      "/stories/ep-1/audio.mp3",
    );

    vi.unstubAllEnvs();
  });
});
