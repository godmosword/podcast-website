/** 嘟嘟小紅車 角落表情夥伴：表情清單與對應規則（純資料，方便測試）。 */

import type { LandingSegmentId } from "@/data/landing-segments";

export type DuduEmotion =
  | "happy"
  | "star"
  | "surprised"
  | "angry"
  | "laugh"
  | "bye";

/** 六款定裝表情（對應 public/landing/mascot/dudu-*.webp）。 */
export const DUDU_EMOTIONS: readonly DuduEmotion[] = [
  "happy",
  "star",
  "surprised",
  "angry",
  "laugh",
  "bye",
] as const;

export const DUDU_EMOTION_LABEL: Record<DuduEmotion, string> = {
  happy: "開心",
  star: "好興奮",
  surprised: "好奇",
  angry: "嘟嘴",
  laugh: "哈哈大笑",
  bye: "揮手掰掰",
};

/** 捲到各 segment 時的基本表情。 */
export const DUDU_EMOTION_BY_SEGMENT: Record<LandingSegmentId, DuduEmotion> = {
  stories: "star",
  bedtime: "happy",
  clay: "laugh",
  health: "surprised",
};

/** 點一下時依序播放的彩蛋表情（用到剩下兩款）。 */
export const DUDU_TAP_SEQUENCE: readonly DuduEmotion[] = ["bye", "angry"] as const;

/** 取得下一個彩蛋表情；null 表示尚未播放過。 */
export function nextTapEmotion(current: DuduEmotion | null): DuduEmotion {
  if (current === null) return DUDU_TAP_SEQUENCE[0];
  const idx = DUDU_TAP_SEQUENCE.indexOf(current);
  return DUDU_TAP_SEQUENCE[(idx + 1) % DUDU_TAP_SEQUENCE.length];
}

export function emotionSrc(emotion: DuduEmotion): string {
  return `/landing/mascot/dudu-${emotion}.webp`;
}
