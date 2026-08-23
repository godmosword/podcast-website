import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getStories } from "../../data/content";
import { storyCoverPath } from "../../lib/story-utils";
import {
  auditAssets,
  collectDynamicReferencePaths,
  diskPathToPublicUrl,
  listDeployedImagePaths,
  MAX_JPG_BYTES,
  publicUrlToDiskPath,
  STAGING_DIRS,
} from "./audit-assets-core";

const ROOT = process.cwd();

describe("audit-assets-core (D0)", () => {
  it("publicUrlToDiskPath 對齊 public/ 根", () => {
    expect(publicUrlToDiskPath("/landing/segment-stories.jpg")).toBe(
      join("public", "landing", "segment-stories.jpg"),
    );
  });

  it("動態推導含故事封面與 landing segment", () => {
    const paths = collectDynamicReferencePaths();
    const first = getStories()[0];
    expect(paths).toContain(storyCoverPath(first.slug));
    expect(paths).toContain(storyCoverPath(first.slug).replace(/\.jpe?g$/i, ".avif"));
    expect(paths).toContain("/landing/segment-stories.jpg");
    expect(paths).toContain("/hero-home.jpg");
  });

  it("部署資產含 git tracked 的 public 圖片", () => {
    const deployed = listDeployedImagePaths(ROOT);
    expect(deployed.length).toBeGreaterThan(100);
    expect(deployed.some((p) => p.startsWith("public/stories/"))).toBe(true);
  });

  it("staging 目錄定義對齊 .gitignore", () => {
    for (const dir of STAGING_DIRS) {
      expect(dir.startsWith("public/.")).toBe(true);
    }
  });

  it("稽核報告結構與 2026-07-11 基線數量級一致", () => {
    const report = auditAssets(ROOT);
    expect(report.deployed.jpgCount).toBeGreaterThanOrEqual(300);
    expect(report.deployed.storyIllustrationCount).toBeGreaterThanOrEqual(280);
    expect(report.dynamic.referenceCount).toBeGreaterThan(50);
    for (const entry of report.deployed.largeJpgs) {
      expect(entry.bytes).toBeGreaterThan(MAX_JPG_BYTES);
    }
  });

  it("故事插圖路徑可回推磁碟", () => {
    const story = getStories().find((s) => s.pageCount > 1);
    expect(story).toBeTruthy();
    const url = storyCoverPath(story!.slug, 1);
    const diskRel = publicUrlToDiskPath(url);
    expect(existsSync(join(ROOT, diskRel))).toBe(true);
    expect(diskPathToPublicUrl(join(ROOT, diskRel), ROOT)).toBe(url);
  });
});
