/**
 * 親子遊樂地圖類型視覺 token（卡片色塊／地圖 pin 共用）。
 * 與宇宙地圖 zone-art 無關。
 */
import type { PlaygroundType } from "@/data/playgrounds";

export const PLAYGROUND_TYPE_VISUAL_KEYS = [
  "park",
  "indoor-park",
  "theme-park",
  "museum",
  "zoo",
  "farm",
  "other",
] as const;

export type PlaygroundTypeVisualKey =
  (typeof PLAYGROUND_TYPE_VISUAL_KEYS)[number];

export function playgroundTypeVisualKey(
  type: PlaygroundType,
): PlaygroundTypeVisualKey {
  switch (type) {
    case "公園":
      return "park";
    case "室內樂園":
      return "indoor-park";
    case "主題樂園":
      return "theme-park";
    case "博物館":
      return "museum";
    case "動物園":
      return "zoo";
    case "農場":
      return "farm";
    case "其他":
      return "other";
  }
}
