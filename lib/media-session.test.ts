import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearMediaSession,
  isMediaSessionSupported,
  setMediaSessionHandlers,
  setMediaSessionMetadata,
  setMediaSessionPlaybackState,
  setMediaSessionPositionState,
} from "./media-session";

type FakeSession = {
  metadata: unknown;
  playbackState: string;
  setActionHandler: ReturnType<typeof vi.fn>;
  setPositionState: ReturnType<typeof vi.fn>;
};

let fake: FakeSession;

function installSession(session: unknown): void {
  Object.defineProperty(globalThis.navigator, "mediaSession", {
    value: session,
    configurable: true,
  });
}

beforeEach(() => {
  fake = {
    metadata: undefined,
    playbackState: "none",
    setActionHandler: vi.fn(),
    setPositionState: vi.fn(),
  };
  installSession(fake);
  vi.stubGlobal(
    "MediaMetadata",
    class {
      title: string;
      artist: string;
      album?: string;
      artwork?: unknown;
      constructor(init: {
        title: string;
        artist: string;
        album?: string;
        artwork?: unknown;
      }) {
        this.title = init.title;
        this.artist = init.artist;
        this.album = init.album;
        this.artwork = init.artwork;
      }
    },
  );
});

afterEach(() => {
  installSession(undefined);
  vi.unstubAllGlobals();
});

describe("isMediaSessionSupported", () => {
  it("navigator.mediaSession 不存在時為 false", () => {
    installSession(undefined);
    expect(isMediaSessionSupported()).toBe(false);
  });

  it("存在時為 true", () => {
    expect(isMediaSessionSupported()).toBe(true);
  });
});

describe("setMediaSessionMetadata", () => {
  it("寫入標題、作者與封面", () => {
    setMediaSessionMetadata({
      title: "大黃卡車",
      artist: "車車遊樂園",
      album: "看圖聽故事",
      artwork: [{ src: "/a.jpg", sizes: "512x512", type: "image/jpeg" }],
    });
    expect(fake.metadata).toMatchObject({
      title: "大黃卡車",
      artist: "車車遊樂園",
      album: "看圖聽故事",
    });
  });

  it("傳 null 清空", () => {
    setMediaSessionMetadata({ title: "x", artist: "y" });
    setMediaSessionMetadata(null);
    expect(fake.metadata).toBeNull();
  });

  it("不支援時不丟例外", () => {
    installSession(undefined);
    expect(() =>
      setMediaSessionMetadata({ title: "x", artist: "y" }),
    ).not.toThrow();
  });
});

describe("setMediaSessionHandlers", () => {
  it("逐顆掛上並回傳可全部卸除的 cleanup", () => {
    const play = vi.fn();
    const pause = vi.fn();
    const cleanup = setMediaSessionHandlers({ play, pause });
    expect(fake.setActionHandler).toHaveBeenCalledWith("play", play);
    expect(fake.setActionHandler).toHaveBeenCalledWith("pause", pause);

    fake.setActionHandler.mockClear();
    cleanup();
    expect(fake.setActionHandler).toHaveBeenCalledWith("play", null);
    expect(fake.setActionHandler).toHaveBeenCalledWith("pause", null);
  });

  it("單顆 action 不支援時其餘照掛，且 cleanup 不碰失敗的那顆", () => {
    fake.setActionHandler.mockImplementation((action: string) => {
      if (action === "seekto") throw new TypeError("unsupported");
    });
    const play = vi.fn();
    const cleanup = setMediaSessionHandlers({ play, seekto: vi.fn() });
    expect(fake.setActionHandler).toHaveBeenCalledWith("play", play);

    fake.setActionHandler.mockClear();
    fake.setActionHandler.mockImplementation(() => {});
    cleanup();
    expect(fake.setActionHandler).toHaveBeenCalledWith("play", null);
    expect(fake.setActionHandler).not.toHaveBeenCalledWith("seekto", null);
  });

  it("不支援時回傳的 cleanup 可安全呼叫", () => {
    installSession(undefined);
    expect(() => setMediaSessionHandlers({ play: vi.fn() })()).not.toThrow();
  });
});

describe("setMediaSessionPlaybackState", () => {
  it("寫入狀態", () => {
    setMediaSessionPlaybackState("playing");
    expect(fake.playbackState).toBe("playing");
  });
});

describe("setMediaSessionPositionState", () => {
  it("正常值送出，position 夾在 duration 內", () => {
    setMediaSessionPositionState({ duration: 100, position: 42 });
    expect(fake.setPositionState).toHaveBeenCalledWith({
      duration: 100,
      position: 42,
      playbackRate: 1,
    });

    fake.setPositionState.mockClear();
    setMediaSessionPositionState({ duration: 100, position: 140 });
    expect(fake.setPositionState).toHaveBeenCalledWith({
      duration: 100,
      position: 100,
      playbackRate: 1,
    });
  });

  it.each([
    ["duration 為 0", { duration: 0, position: 0 }],
    ["duration 為 NaN", { duration: Number.NaN, position: 0 }],
    ["duration 為 Infinity", { duration: Number.POSITIVE_INFINITY, position: 0 }],
    ["position 為負", { duration: 10, position: -1 }],
    ["playbackRate 為 0", { duration: 10, position: 1, playbackRate: 0 }],
  ])("%s 時完全不呼叫（呼叫會丟 TypeError）", (_label, input) => {
    setMediaSessionPositionState(input);
    expect(fake.setPositionState).not.toHaveBeenCalled();
  });

  it("傳 null 清除", () => {
    setMediaSessionPositionState(null);
    expect(fake.setPositionState).toHaveBeenCalledWith();
  });

  it("實作丟例外時不外洩", () => {
    fake.setPositionState.mockImplementation(() => {
      throw new TypeError("bad state");
    });
    expect(() =>
      setMediaSessionPositionState({ duration: 10, position: 1 }),
    ).not.toThrow();
  });
});

describe("clearMediaSession", () => {
  it("同時清 metadata、狀態與進度", () => {
    setMediaSessionMetadata({ title: "x", artist: "y" });
    clearMediaSession();
    expect(fake.metadata).toBeNull();
    expect(fake.playbackState).toBe("none");
    expect(fake.setPositionState).toHaveBeenCalledWith();
  });
});
