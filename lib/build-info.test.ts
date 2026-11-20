import { afterEach, describe, expect, it, vi } from "vitest";
import { currentBuildInfo } from "./build-info";

describe("currentBuildInfo", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("回報 Vercel 寫進 build 的 commit 與版別", () => {
    vi.stubEnv("VERCEL_GIT_COMMIT_SHA", " c1e4a9b2 ");
    vi.stubEnv("NEXT_PUBLIC_SITE_EDITION", "official");
    expect(currentBuildInfo()).toEqual({ commit: "c1e4a9b2", edition: "official" });
  });

  it("本機沒有 commit 時回 null，版別預設 current", () => {
    vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "");
    vi.stubEnv("NEXT_PUBLIC_SITE_EDITION", "");
    vi.stubEnv("SITE_EDITION", "");
    expect(currentBuildInfo()).toEqual({ commit: null, edition: "current" });
  });
});
