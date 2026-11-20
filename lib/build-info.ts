import { getSiteEdition, type SiteEdition } from "./site-edition";

/**
 * 這個部署是哪個 commit、哪個版別。
 * 部署後檢查（.github/workflows/live-domain.yml）靠它確認正式網域已換上這次的 build。
 * repo 是公開的，commit 與版別都不是祕密。
 */
export type BuildInfo = {
  readonly commit: string | null;
  readonly edition: SiteEdition;
};

export function currentBuildInfo(): BuildInfo {
  const commit = process.env.VERCEL_GIT_COMMIT_SHA?.trim();
  return { commit: commit || null, edition: getSiteEdition() };
}
