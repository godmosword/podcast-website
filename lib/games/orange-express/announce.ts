import { speakText } from "@/lib/games/shared/speech";
import type { Station } from "@/lib/games/orange-express/types";

/**
 * 車內廣播。現在用瀏覽器朗讀（zh-TW）暫代；之後家人或小橘錄好音檔，
 * 放到 `public/games/v2/orange-express/voice/<id>.m4a` 並登記在 ANNOUNCE_CLIPS，就會改播錄音。
 * 沒有朗讀也沒有錄音時安靜略過。開關跟抬頭音效走，由呼叫端決定要不要叫。
 */

export type Announcement = {
  /** 錄音檔對照用的 id，例如 next-orange-park。 */
  id: string;
  text: string;
};

/** id → 音檔網址。空的就全部走朗讀。 */
export type AnnounceClips = Readonly<Partial<Record<string, string>>>;

export const ANNOUNCE_CLIPS: AnnounceClips = {};

export type AnnounceResult = "clip" | "tts" | "silent";

export type AnnounceDeps = {
  clips?: AnnounceClips;
  speak?: (text: string, options: { interrupt: boolean; volume: number }) => void;
  /** 播得起來回傳 true。 */
  playClip?: (url: string, volume: number, onFail: () => void) => boolean;
  canSpeak?: () => boolean;
};

/**
 * 一句大約念多久（毫秒）：稍慢的童聲一個字約 0.3 秒，前後各留一點。
 * 用來排先後，念完「下一站」才輪到前窗提示；不是逾時上限。
 */
export function speechMs(text: string): number {
  return 600 + text.length * 300;
}

export function nextStationAnnouncement(station: Pick<Station, "id" | "name">): Announcement {
  return { id: `next-${station.id}`, text: `下一站，${station.name}站` };
}

function browserCanSpeak(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.speechSynthesis !== "undefined" &&
    typeof window.SpeechSynthesisUtterance === "function"
  );
}

function browserPlayClip(url: string, volume: number, onFail: () => void): boolean {
  if (typeof Audio === "undefined") return false;
  try {
    const audio = new Audio(url);
    audio.volume = Math.min(1, Math.max(0, volume));
    void audio.play().catch(onFail);
    return true;
  } catch {
    return false;
  }
}

export function announce(item: Announcement, volume: number, deps: AnnounceDeps = {}): AnnounceResult {
  if (!(volume > 0)) return "silent";
  const clips = deps.clips ?? ANNOUNCE_CLIPS;
  const speak = deps.speak ?? speakText;
  const canSpeak = deps.canSpeak ?? browserCanSpeak;
  const playClip = deps.playClip ?? browserPlayClip;
  const say = () => {
    if (canSpeak()) speak(item.text, { interrupt: true, volume });
  };
  const url = clips[item.id];
  if (url && playClip(url, volume, say)) return "clip";
  if (!canSpeak()) return "silent";
  speak(item.text, { interrupt: true, volume });
  return "tts";
}
