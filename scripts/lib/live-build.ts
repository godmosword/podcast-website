import type { SiteEdition } from "../../lib/site-edition";

/**
 * 正式網域部署後檢查的判斷邏輯。網路與 git 呼叫留在 CLI，這裡只放純函式。
 * 見 scripts/wait-for-live-build.ts 與 .github/workflows/live-domain.yml。
 */

export type LiveBuildInfo = {
  readonly commit: string | null;
  readonly edition: SiteEdition;
};

export type LiveProbe =
  | { readonly kind: "ok"; readonly info: LiveBuildInfo }
  | { readonly kind: "unavailable"; readonly reason: string };

export type LiveDecision = "ready" | "not-owner" | "wait";

const EDITIONS: readonly SiteEdition[] = ["current", "lab", "official"];
const STORY_ASSET_PATH = /^public\/stories\/(ep-\d+)\//;

/**
 * 哪個分支的部署可能掛在正式網域上。
 * 移網域前是 main（current），移網域後是 release（official）；lab 永遠不掛正式網域。
 */
export function expectedEditionForBranch(branch: string): SiteEdition | null {
  if (branch === "release") return "official";
  if (branch === "main") return "current";
  return null;
}

/** 驗 /build-info.json 的形狀。外部回應不可信，對不上就回 null。 */
export function parseBuildInfo(body: unknown): LiveBuildInfo | null {
  if (typeof body !== "object" || body === null) return null;
  const { commit, edition } = body as Record<string, unknown>;
  if (!EDITIONS.includes(edition as SiteEdition)) return null;
  if (commit !== null && typeof commit !== "string") return null;
  return { commit, edition: edition as SiteEdition };
}

/**
 * - ready：正式網域已經在跑這個 commit。
 * - not-owner：正式網域由另一個版別服務，這次 push 的分支不負責，直接略過。
 * - wait：還是舊 commit，或暫時讀不到；繼續等到逾時。
 */
export function decideLiveBuild(
  probe: LiveProbe,
  expected: SiteEdition,
  sha: string,
): LiveDecision {
  if (probe.kind !== "ok") return "wait";
  if (probe.info.edition !== expected) return "not-owner";
  return probe.info.commit === sha ? "ready" : "wait";
}

function byEpisode(left: string, right: string): number {
  return Number(left.slice(3)) - Number(right.slice(3));
}

/** main 的 push：哪些集數的素材有變。 */
export function storySlugsFromChangedPaths(paths: readonly string[]): string[] {
  const slugs = paths.flatMap((path) => {
    const match = STORY_ASSET_PATH.exec(path);
    return match ? [match[1]] : [];
  });
  return [...new Set(slugs)].sort(byEpisode);
}

/** release 的 push：發行清單新核准或新下架的集數。兩種都要通知搜尋引擎。 */
export function storySlugChanges(
  before: readonly string[],
  after: readonly string[],
): string[] {
  const previous = new Set(before);
  const next = new Set(after);
  const added = after.filter((slug) => !previous.has(slug));
  const removed = before.filter((slug) => !next.has(slug));
  return [...new Set([...added, ...removed])].sort(byEpisode);
}
