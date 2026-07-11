/** 嘟嘟小紅車表情資料（canonical）。 */

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

/** 點一下時切到下一個表情，循環走完全部六款。 */
export function nextEmotion(current: DuduEmotion): DuduEmotion {
  const idx = DUDU_EMOTIONS.indexOf(current);
  return DUDU_EMOTIONS[(idx + 1) % DUDU_EMOTIONS.length];
}

export function emotionSrc(emotion: DuduEmotion): string {
  return `/landing/mascot/dudu-${emotion}.webp`;
}
