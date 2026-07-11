import type { CelebrationEventId, CelebrationIntensity } from "@/data/celebration";
import type { CandyKartFinishMessage } from "@/lib/gamekit/games/candy-kart-bridge";

/** 父頁 → iframe 慶祝訊息（adapter 契約；子頁可選實作）。 */
export const CELEBRATION_IFRAME_SOURCE = "cheche-celebration" as const;

export type CelebrationIframeMessage = {
  source: typeof CELEBRATION_IFRAME_SOURCE;
  type: "celebrate";
  event: CelebrationEventId;
  intensity: CelebrationIntensity;
};

export function buildCelebrationIframeMessage(
  event: CelebrationEventId,
  intensity: CelebrationIntensity,
): CelebrationIframeMessage {
  return {
    source: CELEBRATION_IFRAME_SOURCE,
    type: "celebrate",
    event,
    intensity,
  };
}

export function celebrationEventFromKartFinish(
  _msg: CandyKartFinishMessage,
): CelebrationEventId {
  return "game_race_finish";
}
