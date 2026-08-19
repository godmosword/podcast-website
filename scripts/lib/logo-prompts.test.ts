import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getCharacterLogos, NON_VEHICLE_SLUGS } from "@/data/character-logos";
import {
  buildLogoPrompt,
  parseSharedPromptBlocks,
  renderLogoPromptMarkdown,
} from "../generate-logo-prompts";

const ROOT = process.cwd();
const SHARED = join(ROOT, "docs/logo-prompts/_shared.md");

describe("logo prompts", () => {
  const logos = getCharacterLogos();
  const shared = readFileSync(SHARED, "utf8");
  const blocks = parseSharedPromptBlocks(shared);

  it("解析出全部恆定層區塊", () => {
    expect(Object.keys(blocks).sort()).toEqual(
      [
        "complexity",
        "composition-non-vehicle",
        "composition-vehicle",
        "eyes",
        "forbid",
        "lead",
        "output",
        "style",
      ].sort(),
    );
  });

  it("35 份角色檔存在且內嵌共用原文", () => {
    const vehicleKeys = ["lead", "complexity", "eyes", "composition-vehicle", "style", "forbid", "output"];
    const nonVehicleKeys = [
      "lead",
      "complexity",
      "eyes",
      "composition-non-vehicle",
      "style",
      "forbid",
      "output",
    ];
    const nonVehicle = new Set<string>(NON_VEHICLE_SLUGS);

    expect(logos).toHaveLength(35);
    for (const logo of logos) {
      const path = join(ROOT, "docs/logo-prompts", `${logo.slug}.md`);
      expect(existsSync(path), path).toBe(true);
      const body = readFileSync(path, "utf8");
      const keys = nonVehicle.has(logo.slug) ? nonVehicleKeys : vehicleKeys;
      for (const key of keys) {
        expect(body, `${logo.slug} 缺 BLOCK:${key}`).toContain(blocks[key]);
      }
      expect(body).toContain(logo.name);
      expect(body).toContain(logo.feature);
      expect(body).toContain(logo.ipColorPrimary);
      expect(body).toContain(logo.ipColorSecondary);
    }
  });

  it("產物與 buildLogoPrompt 一致（避免手改角色檔不同步）", () => {
    for (const logo of logos) {
      const path = join(ROOT, "docs/logo-prompts", `${logo.slug}.md`);
      expect(readFileSync(path, "utf8")).toBe(
        renderLogoPromptMarkdown(logo, blocks),
      );
      expect(buildLogoPrompt(logo, blocks)).toContain(logo.slug);
    }
  });
});
