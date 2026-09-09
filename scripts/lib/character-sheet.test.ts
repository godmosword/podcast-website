import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  XIAO_HONG_DO_NOT,
  XIAO_HONG_IDENTITY,
  XIAO_HONG_SILHOUETTE_TEST,
  xiaoHongDescSuffix,
} from "./character-sheet";

const ROOT = process.cwd();

type RawCharacter = { name: string; desc: string };

function characters(): RawCharacter[] {
  return JSON.parse(readFileSync(join(ROOT, "data/characters.json"), "utf8")) as RawCharacter[];
}

function descOf(name: string): string {
  const found = characters().find((c) => c.name === name);
  expect(found, `characters.json 應有 ${name}`).toBeDefined();
  return found!.desc;
}

describe("小紅賽車角色設定書 SSOT", () => {
  it("每次生圖必附的 Do-NOT 清單涵蓋規格 §2.4 的五項", () => {
    // 「不出現號碼 95 或閃電貼紙」
    expect(XIAO_HONG_DO_NOT).toContain("the number 95");
    expect(XIAO_HONG_DO_NOT).toContain("lightning bolt decal");
    // 「不用低趴流線型跑車車身」
    expect(XIAO_HONG_DO_NOT).toContain("low-slung streamlined sports car body");
    // 「嘴巴不做在水箱罩格柵上」
    expect(XIAO_HONG_DO_NOT).toContain("mouth built into the radiator grille");
    // 「整體不得讓人一眼聯想到《Cars》」
    expect(XIAO_HONG_DO_NOT).toContain("Lightning McQueen");
    // 瞇眼測試
    expect(XIAO_HONG_SILHOUETTE_TEST).toContain("silhouette");
  });

  it("設定書只鎖既有 canon，不夾帶推翻 canon 的三項", () => {
    // 眼睛改放大燈、加黃條紋、加車頂星星天線都會使既有角色圖庫與約 24 集插圖過期，
    // 屬付費重抽＋人工審圖，須維護者裁決；在那之前不得從 SSOT 偷渡進生圖 prompt。
    // 見 docs/specs/HERO-PARALLAX-SPEC.md §2.5。
    const sheet = `${XIAO_HONG_IDENTITY} ${XIAO_HONG_DO_NOT} ${XIAO_HONG_SILHOUETTE_TEST}`;
    expect(sheet).not.toMatch(/star antenna/i);
    expect(sheet).not.toMatch(/yellow (racing )?stripe/i);
    expect(sheet).not.toMatch(/eyes (are |placed )?on the headlights/i);
    expect(sheet).not.toMatch(/eyes on the windshield/i);
    // 大燈仍須與眼睛分離——這是定裝照既有的樣子，屬鎖定而非變更。
    expect(XIAO_HONG_IDENTITY).toContain("kept separate from the eyes");
  });

  it("小紅賽車的 desc 帶著設定書與 Do-NOT 清單", () => {
    const desc = descOf("小紅賽車");
    expect(desc).toContain(XIAO_HONG_IDENTITY);
    expect(desc).toContain(XIAO_HONG_DO_NOT);
    expect(desc).toContain(XIAO_HONG_SILHOUETTE_TEST);
    expect(desc.endsWith(xiaoHongDescSuffix())).toBe(true);
  });

  it("三個對 ep-23／ep-24 已出圖的連貫性鎖沒有被動到", () => {
    // 這三個條目明文寫死臉部配置以對齊已出圖的畫面；本輪不得改動。
    expect(descOf("小紅賽車的爸爸")).toContain("eyes ONLY on the windshield");
    expect(descOf("小紅賽車年幼版")).toContain("eyes are NOT headlights on the bumper");
    expect(descOf("小紅賽車的爸爸年輕版")).toContain("copy reference dad 1:1");
  });

  it("roamer 生圖 prompt 正反兩向都掛上設定書", () => {
    const source = readFileSync(join(ROOT, "scripts/generate-roamer-assets.ts"), "utf8");
    const xiaoHong = source.slice(
      source.indexOf('id: "xiao-hong"'),
      source.indexOf('id: "duo-duo"'),
    );
    expect(xiaoHong).not.toBe("");
    // front 與 rear 各一組，共兩次
    expect(xiaoHong.match(/XIAO_HONG_IDENTITY/g)).toHaveLength(2);
    expect(xiaoHong.match(/XIAO_HONG_SILHOUETTE_TEST/g)).toHaveLength(2);
    expect(xiaoHong.match(/XIAO_HONG_DO_NOT/g)).toHaveLength(2);
  });
});
