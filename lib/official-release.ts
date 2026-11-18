import manifestJson from "../data/official-release.json";
import { canonicalStorySlug } from "./story-slug-aliases";
import { OFFICIAL_SITE_ORIGIN, getSiteEdition } from "./site-edition";

/**
 * 官網發行清單。品質檢查（verify:release-content）不是這份人工核准。
 * 素材雜湊在 data/official-release-assets.json，只給發行腳本讀，不進客戶端 bundle。
 */

export type ReleaseBucket = "stories" | "parentArticles" | "newsletters" | "travelAbroad";

export type OfficialReleaseManifest = {
  version: 1;
  id: string;
  sourceCommit: string;
  humanApproved: boolean;
  approvedAt: string;
  qualityCheck: {
    status: "not-run" | "passed" | "failed";
    command: string;
    note: string;
  };
  previousId: string | null;
  stories: string[];
  parentArticles: string[];
  newsletters: string[];
  travelAbroad: string[];
  revokedStorySlugs: string[];
};

const manifest = manifestJson as OfficialReleaseManifest;

export function officialReleaseManifest(): OfficialReleaseManifest {
  return manifest;
}

export function frozenEpisodeGuid(slug: string): string {
  return `${OFFICIAL_SITE_ORIGIN}/story/${canonicalStorySlug(slug)}`;
}

export function filterReleased<T extends { slug: string }>(
  items: readonly T[],
  bucket: ReleaseBucket,
): readonly T[] {
  if (getSiteEdition() !== "official") return items;
  const allowed = new Set(manifest[bucket]);
  return items.filter((item) => allowed.has(item.slug));
}

/** 官網建置在清單未核准時失敗。current／lab 不讀這道閘。 */
export function assertOfficialReleaseReady(): void {
  if (getSiteEdition() !== "official" && process.env.SITE_EDITION?.trim() !== "official") {
    return;
  }
  if (!manifest.humanApproved || manifest.id === "uninitialized") {
    throw new Error("官網建置需要已人工核准的 data/official-release.json。");
  }
}
