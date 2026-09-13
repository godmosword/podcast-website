/**
 * Media Session 薄封裝：把播放狀態送到鎖屏、耳機按鍵、車機與通知列。
 *
 * 為什麼要包一層而不直接用 `navigator.mediaSession`：
 *   1. `setActionHandler` 對**不支援的 action** 會丟 `TypeError`（Safari 對
 *      `seekto`／`stop` 歷來不一致），一顆沒接住就會炸掉整個 effect。
 *   2. `setPositionState` 對 `duration` 為 0／NaN／`position > duration` 會丟
 *      `TypeError`。音檔是 `preload="none"`，metadata 到齊前這三種值都會出現。
 *   3. SSR 沒有 `navigator`，而播放器雖然是 `ssr:false`，這支 lib 仍可能被
 *      伺服器端的測試或其他入口載入。
 *
 * 所以這裡的每個 export 都是「無聲失敗」：不支援就什麼都不做，呼叫端不必判斷。
 */

/** 專輯封面來源；`sizes` 用 `"512x512"` 這種 MediaImage 格式。 */
export type MediaSessionArtwork = {
  src: string;
  sizes: string;
  type: string;
};

export type MediaSessionMetadataInput = {
  title: string;
  artist: string;
  album?: string;
  artwork?: MediaSessionArtwork[];
};

export type MediaSessionHandlers = Partial<
  Record<MediaSessionAction, MediaSessionActionHandler>
>;

export type MediaSessionPosition = {
  duration: number;
  position: number;
  playbackRate?: number;
};

function session(): MediaSession | null {
  if (typeof navigator === "undefined") return null;
  return navigator.mediaSession ?? null;
}

export function isMediaSessionSupported(): boolean {
  return session() !== null;
}

export function setMediaSessionMetadata(
  input: MediaSessionMetadataInput | null,
): void {
  const ms = session();
  if (!ms) return;
  if (!input) {
    ms.metadata = null;
    return;
  }
  if (typeof MediaMetadata === "undefined") return;
  try {
    ms.metadata = new MediaMetadata({
      title: input.title,
      artist: input.artist,
      ...(input.album ? { album: input.album } : {}),
      ...(input.artwork ? { artwork: input.artwork } : {}),
    });
  } catch {
    // 某些瀏覽器對 artwork 取用失敗會丟例外；有沒有封面不該擋住播放。
  }
}

/**
 * 逐顆掛上 action handler，回傳把它們全部卸掉的 cleanup。
 * 單顆不支援只跳過那一顆，其餘照掛。
 */
export function setMediaSessionHandlers(
  handlers: MediaSessionHandlers,
): () => void {
  const ms = session();
  if (!ms) return () => {};

  const attached: MediaSessionAction[] = [];
  for (const [action, handler] of Object.entries(handlers) as [
    MediaSessionAction,
    MediaSessionActionHandler,
  ][]) {
    try {
      ms.setActionHandler(action, handler);
      attached.push(action);
    } catch {
      // 此瀏覽器不支援這個 action。
    }
  }

  return () => {
    for (const action of attached) {
      try {
        ms.setActionHandler(action, null);
      } catch {
        // 卸載時同樣不該丟。
      }
    }
  };
}

export function setMediaSessionPlaybackState(
  state: MediaSessionPlaybackState,
): void {
  const ms = session();
  if (!ms) return;
  try {
    ms.playbackState = state;
  } catch {
    // 唯讀實作（少數 WebView）：忽略。
  }
}

/**
 * 更新鎖屏進度條。`duration` 未就緒（0／NaN／Infinity）或 `position` 越界時
 * 直接不送——送了會丟 `TypeError`，而規格允許完全不呼叫。
 */
export function setMediaSessionPositionState(
  input: MediaSessionPosition | null,
): void {
  const ms = session();
  if (!ms || typeof ms.setPositionState !== "function") return;

  if (!input) {
    try {
      ms.setPositionState();
    } catch {
      // 清除不支援時忽略。
    }
    return;
  }

  const { duration, position } = input;
  if (!Number.isFinite(duration) || duration <= 0) return;
  if (!Number.isFinite(position) || position < 0) return;

  const playbackRate = input.playbackRate ?? 1;
  if (!Number.isFinite(playbackRate) || playbackRate <= 0) return;

  try {
    ms.setPositionState({
      duration,
      position: Math.min(position, duration),
      playbackRate,
    });
  } catch {
    // 規格外的組合仍可能丟；鎖屏進度條不是關鍵路徑。
  }
}

/** 離開播放頁時把 metadata、狀態與進度一併清掉，避免鎖屏殘留上一集。 */
export function clearMediaSession(): void {
  setMediaSessionMetadata(null);
  setMediaSessionPlaybackState("none");
  setMediaSessionPositionState(null);
}
