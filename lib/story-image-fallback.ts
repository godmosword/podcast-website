/**
 * 播放頁每張插圖的載入退回狀態。跟音檔共用的 isLoading 分開：音檔 canplay 不該收掉等 JPG 的骨架。
 */
export type ImageFallback = {
  /** 現代格式載入失敗、改用 JPG 的插圖。 */
  jpgOnly: ReadonlySet<string>;
  /** 已改用 JPG、還沒載好：骨架蓋著，不閃破圖與 alt。 */
  waitingJpg: ReadonlySet<string>;
  /** JPG 也載不到。翻到這一頁才說，翻走就收（鄰頁是預掛載的，孩子還沒看到）。 */
  failed: ReadonlySet<string>;
};

export const NO_IMAGE_FALLBACK: ImageFallback = {
  jpgOnly: new Set(),
  waitingJpg: new Set(),
  failed: new Set(),
};

function withItem(set: ReadonlySet<string>, item: string): ReadonlySet<string> {
  return new Set(set).add(item);
}

function withoutItem(set: ReadonlySet<string>, item: string): ReadonlySet<string> {
  return new Set([...set].filter((value) => value !== item));
}

export function imageLoaded(state: ImageFallback, src: string): ImageFallback {
  if (!state.waitingJpg.has(src)) return state;
  return { ...state, waitingJpg: withoutItem(state.waitingJpg, src) };
}

/** modern：這次失敗的是現代格式（還能退回 JPG）。 */
export function imageErrored(state: ImageFallback, src: string, modern: boolean): ImageFallback {
  if (modern) {
    return {
      ...state,
      jpgOnly: withItem(state.jpgOnly, src),
      waitingJpg: withItem(state.waitingJpg, src),
    };
  }
  return {
    ...state,
    waitingJpg: withoutItem(state.waitingJpg, src),
    failed: withItem(state.failed, src),
  };
}
