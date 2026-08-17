import { listPlaygrounds, type Playground } from "./playgrounds";

export const PLAY_MAP_EDITORIAL_INTENTS = [
  "rainy-day",
  "free",
  "high-energy",
  "indoor",
  "easy-parking",
] as const;

export type PlayMapEditorialIntent =
  (typeof PLAY_MAP_EDITORIAL_INTENTS)[number];

export type PlayMapEditorialPick = {
  placeId: string;
  intents: readonly PlayMapEditorialIntent[];
  reason: string;
  priority?: number;
};

/**
 * Editorial opinion lives beside, rather than inside, factual place data.
 * Reasons intentionally stay short and only restate existing structured facts
 * or parent-facing tips; filtering truth remains owned by Playground fields.
 */
export const PLAY_MAP_EDITORIAL_PICKS: readonly PlayMapEditorialPick[] = [
  {
    placeId: "ty-kids-museum",
    intents: ["rainy-day", "free", "indoor"],
    reason: "室內展覽與創作體驗；免費入場，雨天也有備案。",
    priority: 80,
  },
  {
    placeId: "nt-linkou-sports",
    intents: ["free", "high-energy", "easy-parking"],
    reason: "有兒童遊戲場、跑道與籃球場，並設停車場。",
    priority: 70,
  },
  {
    placeId: "hc-nanliao",
    intents: ["free", "high-energy"],
    reason: "大型遊具與沙坑都已備好，適合帶孩子放電。",
    priority: 60,
  },
  {
    placeId: "kh-main-library",
    intents: ["rainy-day", "free", "indoor"],
    reason: "室內免費，開到晚上 10 點；雨天或傍晚也能安排。",
    priority: 50,
  },
] as const;

export type PlayMapEditorialValidationIssue = {
  placeId: string;
  message: string;
};

const editorialIntentSet = new Set<string>(PLAY_MAP_EDITORIAL_INTENTS);

export function validatePlayMapEditorialPicks(
  picks: readonly PlayMapEditorialPick[] = PLAY_MAP_EDITORIAL_PICKS,
  places: readonly Pick<Playground, "id">[] = listPlaygrounds(),
): PlayMapEditorialValidationIssue[] {
  const placeIds = new Set(places.map((place) => place.id));
  const seen = new Set<string>();
  const issues: PlayMapEditorialValidationIssue[] = [];

  for (const pick of picks) {
    if (!placeIds.has(pick.placeId)) {
      issues.push({
        placeId: pick.placeId,
        message: "placeId does not reference a playground",
      });
    }
    if (seen.has(pick.placeId)) {
      issues.push({
        placeId: pick.placeId,
        message: "duplicate placeId",
      });
    }
    seen.add(pick.placeId);
    if (pick.intents.length === 0) {
      issues.push({
        placeId: pick.placeId,
        message: "at least one editorial intent is required",
      });
    }
    for (const intent of pick.intents) {
      if (!editorialIntentSet.has(intent)) {
        issues.push({
          placeId: pick.placeId,
          message: `unknown editorial intent: ${intent}`,
        });
      }
    }
    if (!pick.reason.trim()) {
      issues.push({
        placeId: pick.placeId,
        message: "reason must not be empty",
      });
    }
  }

  return issues;
}
