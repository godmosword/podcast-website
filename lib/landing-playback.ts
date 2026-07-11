type LandingPlayback = {
  slug: string;
  audio: HTMLAudioElement;
};

let pendingPlayback: LandingPlayback | null = null;

function dispose(playback: LandingPlayback | null): void {
  if (!playback) return;
  playback.audio.pause();
  playback.audio.removeAttribute("src");
  playback.audio.load();
}

/**
 * 必須直接在 click handler 內呼叫，讓瀏覽器把 play() 視為使用者手勢。
 * 音訊物件刻意不掛在 Landing DOM，client navigation 後仍可繼續播放。
 */
export function beginLandingPlayback(
  slug: string,
  src: string,
): Promise<void> {
  dispose(pendingPlayback);

  const audio = new Audio(src);
  audio.preload = "auto";
  pendingPlayback = { slug, audio };
  return audio.play();
}

/** 播放頁接管 Landing 已啟播的同一個 HTMLAudioElement；每次只能取用一次。 */
export function takeLandingPlayback(slug: string): HTMLAudioElement | null {
  if (pendingPlayback?.slug !== slug) return null;
  const audio = pendingPlayback.audio;
  pendingPlayback = null;
  return audio;
}

export function cancelLandingPlayback(): void {
  dispose(pendingPlayback);
  pendingPlayback = null;
}
