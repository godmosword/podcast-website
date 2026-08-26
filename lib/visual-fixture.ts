/**
 * 視覺回歸凍結資料（VIS-DEBT-2）。
 *
 * 只在本機 `npm run test:visual:trusted` 的 **build** 開啟。
 * 站是 SSG：旗標必須在 `next build` 當下生效，光 `next start` 改 env 救不了已烘焙的 HTML。
 *
 * 禁止在 Vercel 任何部署啟用——會把 EP1–6／前 12 景點的子集部署出去。
 */

export const VISUAL_FIXTURE_STORY_SLUGS = [
  "ep-1",
  "ep-2",
  "ep-3",
  "ep-4",
  "ep-5",
  "ep-6",
] as const;

export const VISUAL_FIXTURE_PLAYGROUND_LIMIT = 12;
export const VISUAL_FIXTURE_ANCHOR_PLACE_ID = "ty-kids-museum";

export const VISUAL_PLAYER_STATES = [
  "caption-follow",
  "manual-page",
  "ended",
  "loading",
] as const;

export type VisualPlayerState = (typeof VISUAL_PLAYER_STATES)[number];

const VERCEL_HOSTED = "1";

function isHostedOnVercel(): boolean {
  return process.env.VERCEL === VERCEL_HOSTED;
}

function readFixtureFlag(): boolean {
  return (
    process.env.NEXT_PUBLIC_VISUAL_FIXTURE === "1" ||
    process.env.VISUAL_FIXTURE === "1"
  );
}

/**
 * 視覺 fixture 是否開啟。Vercel 上若誤設旗標會立刻 throw，讓 build 失敗而不是默默少集。
 * Client bundle 只看得到 `NEXT_PUBLIC_VISUAL_FIXTURE`（Play Map 在 client 呼叫 listPlaygrounds）。
 */
export function isVisualFixtureEnabled(): boolean {
  const enabled = readFixtureFlag();
  if (enabled && isHostedOnVercel()) {
    throw new Error(
      "VISUAL_FIXTURE／NEXT_PUBLIC_VISUAL_FIXTURE 禁止在 Vercel 上啟用（會把凍結子集部署出去）。",
    );
  }
  return enabled;
}

export function applyStoryFixture<T extends { slug: string }>(
  stories: readonly T[],
): readonly T[] {
  if (!isVisualFixtureEnabled()) return stories;
  const allowed = new Set<string>(VISUAL_FIXTURE_STORY_SLUGS);
  return stories.filter((story) => allowed.has(story.slug));
}

export function applyPlaygroundFixture<T extends { id: string }>(
  places: readonly T[],
): readonly T[] {
  if (!isVisualFixtureEnabled()) return places;
  const head = places.slice(0, VISUAL_FIXTURE_PLAYGROUND_LIMIT);
  if (head.some((place) => place.id === VISUAL_FIXTURE_ANCHOR_PLACE_ID)) {
    return head;
  }
  const anchor = places.find(
    (place) => place.id === VISUAL_FIXTURE_ANCHOR_PLACE_ID,
  );
  if (!anchor) {
    throw new Error(
      `視覺 fixture 錨點景點 "${VISUAL_FIXTURE_ANCHOR_PLACE_ID}" 不存在。`,
    );
  }
  return [...head.slice(0, VISUAL_FIXTURE_PLAYGROUND_LIMIT - 1), anchor];
}

export function applyCharacterFixture<T extends { appearsIn: string[] }>(
  characters: readonly T[],
): readonly T[] {
  if (!isVisualFixtureEnabled()) return characters;
  const allowed = new Set<string>(VISUAL_FIXTURE_STORY_SLUGS);
  return characters
    .map((character) => ({
      ...character,
      appearsIn: character.appearsIn.filter((slug) => allowed.has(slug)),
    }))
    .filter((character) => character.appearsIn.length > 0);
}

export function parseVisualPlayerState(
  raw: string | null | undefined,
): VisualPlayerState | undefined {
  if (!raw) return undefined;
  return (VISUAL_PLAYER_STATES as readonly string[]).includes(raw)
    ? (raw as VisualPlayerState)
    : undefined;
}

/** 僅 fixture build 承認 `?vp=`，正式站忽略，避免有人用 query 跳到完播畫面。 */
export function visualPlayerStateFromSearch(
  search: string,
): VisualPlayerState | undefined {
  if (!isVisualFixtureEnabled()) return undefined;
  const raw = new URLSearchParams(search.startsWith("?") ? search : `?${search}`).get(
    "vp",
  );
  return parseVisualPlayerState(raw);
}
