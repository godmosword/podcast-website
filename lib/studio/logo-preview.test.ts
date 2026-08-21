import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  isSafeStagingFile,
  listLogoPreviews,
  preferredLogoPreview,
  readLogoStagingAsset,
  stagingAssetUrl,
} from "./logo-preview";

function makeRepo(): string {
  const root = join(tmpdir(), `logo-preview-${Math.random().toString(16).slice(2)}`);
  mkdirSync(join(root, "public/characters/logo"), { recursive: true });
  mkdirSync(join(root, "public/.logo-staging/xiao-hong"), { recursive: true });
  return root;
}

describe("logo preview sources", () => {
  it("staging 檔名只接受 NN.png", () => {
    expect(isSafeStagingFile("01.png")).toBe(true);
    expect(isSafeStagingFile("04.png")).toBe(true);
    expect(isSafeStagingFile("contact.html")).toBe(false);
    expect(isSafeStagingFile("../01.png")).toBe(false);
    expect(isSafeStagingFile("01.PNG")).toBe(false);
  });

  it("無正式檔時 32px 改吃 staging 候選", () => {
    const root = makeRepo();
    writeFileSync(join(root, "public/.logo-staging/xiao-hong/01.png"), "png");
    writeFileSync(join(root, "public/.logo-staging/xiao-hong/02.png"), "png");
    const items = listLogoPreviews(root, "xiao-hong");
    expect(items.map((item) => item.kind)).toEqual(["staging", "staging"]);
    expect(items[0]?.src).toBe(stagingAssetUrl("xiao-hong", "01.png"));
    const preferred = preferredLogoPreview(root, "xiao-hong", 32);
    expect(preferred?.kind).toBe("staging");
    expect(preferred?.src).toBe(stagingAssetUrl("xiao-hong", "01.png"));
  });

  it("有正式 webp 時 32px 優先正式檔", () => {
    const root = makeRepo();
    writeFileSync(join(root, "public/characters/logo/xiao-hong-32.webp"), "webp");
    writeFileSync(join(root, "public/.logo-staging/xiao-hong/01.png"), "png");
    const preferred = preferredLogoPreview(root, "xiao-hong", 32);
    expect(preferred?.kind).toBe("approved");
    expect(preferred?.src).toBe("/characters/logo/xiao-hong-32.webp");
  });

  it("拒絕路徑穿越與未知 slug", () => {
    const root = makeRepo();
    writeFileSync(join(root, "public/.logo-staging/xiao-hong/01.png"), "png");
    expect(readLogoStagingAsset(root, "xiao-hong", "01.png")?.type).toBe(
      "image/png",
    );
    expect(readLogoStagingAsset(root, "xiao-hong", "../01.png")).toBeNull();
    expect(readLogoStagingAsset(root, "not-a-car", "01.png")).toBeNull();
  });
});
