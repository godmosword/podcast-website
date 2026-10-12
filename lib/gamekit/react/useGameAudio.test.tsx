// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GameKitAudioBus } from "@/lib/gamekit/runtime/audio";
import { PROGRESS_STORAGE_KEY } from "@/lib/progress-keys";
import { invalidateSfxCache } from "@/lib/sfx";
import { useGameAudio } from "./useGameAudio";

const unmounts: Array<() => void> = [];

afterEach(() => {
  for (const unmount of unmounts) unmount();
  unmounts.length = 0;
  invalidateSfxCache();
  localStorage.clear();
  vi.restoreAllMocks();
});

function mountAudio() {
  const rendered = renderHook(() => useGameAudio("dino-sushi"));
  unmounts.push(rendered.unmount);
  return rendered;
}

describe("useGameAudio", () => {
  it("其他 key 或音效沒變的 storage 不會把 BGM 從頭再播", () => {
    const playBgm = vi.spyOn(GameKitAudioBus.prototype, "playBgm").mockImplementation(() => {});
    const { result } = mountAudio();
    act(() => result.current.playBgm());
    expect(playBgm).toHaveBeenCalledTimes(1);
    playBgm.mockClear();

    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: "unrelated", newValue: "1" }));
    });
    act(() => {
      const current = localStorage.getItem(PROGRESS_STORAGE_KEY);
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: PROGRESS_STORAGE_KEY,
          oldValue: current,
          newValue: current,
        }),
      );
    });
    expect(playBgm).not.toHaveBeenCalled();
  });

  it("別的分頁把音效關掉時才暫停 BGM", () => {
    const pauseBgm = vi.spyOn(GameKitAudioBus.prototype, "pauseBgm").mockImplementation(() => {});
    vi.spyOn(GameKitAudioBus.prototype, "playBgm").mockImplementation(() => {});
    const { result } = mountAudio();
    act(() => result.current.playBgm());
    pauseBgm.mockClear();
    const oldValue = localStorage.getItem(PROGRESS_STORAGE_KEY);
    const next = JSON.parse(oldValue ?? "{}") as { sfxEnabled?: boolean };
    next.sfxEnabled = false;
    const newValue = JSON.stringify(next);
    localStorage.setItem(PROGRESS_STORAGE_KEY, newValue);
    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", { key: PROGRESS_STORAGE_KEY, oldValue, newValue }),
      );
    });
    expect(pauseBgm).toHaveBeenCalled();
  });

  it("暫停中把聲音關掉再打開，不會呼叫 playBgm", () => {
    const playBgm = vi.spyOn(GameKitAudioBus.prototype, "playBgm").mockImplementation(() => {});
    vi.spyOn(GameKitAudioBus.prototype, "pauseBgm").mockImplementation(() => {});
    const { result } = mountAudio();
    act(() => result.current.playBgm());
    act(() => result.current.pauseBgm());
    playBgm.mockClear();
    act(() => result.current.toggleSound());
    act(() => result.current.toggleSound());
    expect(playBgm).not.toHaveBeenCalled();
  });

  it("遊戲進行中把聲音關掉再打開，會再請 bus 播 BGM", () => {
    const playBgm = vi.spyOn(GameKitAudioBus.prototype, "playBgm").mockImplementation(() => {});
    vi.spyOn(GameKitAudioBus.prototype, "pauseBgm").mockImplementation(() => {});
    const { result } = mountAudio();
    act(() => result.current.playBgm());
    playBgm.mockClear();
    act(() => result.current.toggleSound());
    act(() => result.current.toggleSound());
    expect(playBgm).toHaveBeenCalled();
  });

  it("卸載時關掉這個 bus 的 AudioContext", () => {
    const dispose = vi.spyOn(GameKitAudioBus.prototype, "dispose").mockImplementation(() => {});
    const { result, unmount } = mountAudio();
    act(() => result.current.ensureAudio());
    unmount();
    expect(dispose).toHaveBeenCalledTimes(1);
  });
});
