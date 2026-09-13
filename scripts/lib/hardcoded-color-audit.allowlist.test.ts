import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { HARDCODED_COLOR_ALLOWLIST } from "./hardcoded-color-audit";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

/**
 * allowlist 是「固定美術色」政策的機器可讀版本，最容易腐爛的兩種方式：
 * 檔案被改名／刪掉後條目留著，或某檔已經 token 化了卻還掛在清單上擋掃描。
 * 這兩種都會讓 audit:colors 這個閘門悄悄失去覆蓋範圍。
 */
describe("固定美術色 allowlist", () => {
  it("每個條目對應的檔案都還存在", () => {
    const missing = HARDCODED_COLOR_ALLOWLIST.filter(
      (file) => !existsSync(join(ROOT, file)),
    );
    expect(missing, `已不存在的 allowlist 條目：${missing.join(", ")}`).toEqual(
      [],
    );
  });

  it("每個條目都確實還有裸 hex（否則應從清單移除）", () => {
    const stale = HARDCODED_COLOR_ALLOWLIST.filter((file) => {
      const content = readFileSync(join(ROOT, file), "utf8");
      return !/#[0-9a-fA-F]{3,8}\b/.test(content);
    });
    expect(
      stale,
      `已無裸 hex、應從 allowlist 移除：${stale.join(", ")}`,
    ).toEqual([]);
  });

  it("沒有重複條目", () => {
    expect(new Set(HARDCODED_COLOR_ALLOWLIST).size).toBe(
      HARDCODED_COLOR_ALLOWLIST.length,
    );
  });
});
