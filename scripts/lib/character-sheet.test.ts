import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  XIAO_HONG_DO_NOT,
  XIAO_HONG_FACE_LAYOUT,
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
  it("canon 臉部配置鎖住擋風玻璃眼與分離大燈", () => {
    // 2026-09-09 裁決：以定裝照為準。眼睛在擋風玻璃，黃大燈另外分離並存。
    expect(XIAO_HONG_FACE_LAYOUT).toContain("ON THE WINDSHIELD panel");
    expect(XIAO_HONG_FACE_LAYOUT).toContain("are NOT the eyes");
    expect(XIAO_HONG_FACE_LAYOUT).toContain("both must be present at once");
    // 嘴在下保險桿，不在水箱罩格柵
    expect(XIAO_HONG_FACE_LAYOUT).toContain("front bumper");
  });

  it("Do-NOT 清單同時擋 canon 漂移與版權區隔項", () => {
    // 偏離 canon 的三種漂移
    expect(XIAO_HONG_DO_NOT).toContain("headlights used as eyes");
    expect(XIAO_HONG_DO_NOT).toContain("roof antenna");
    expect(XIAO_HONG_DO_NOT).toContain("yellow racing stripe");
    // 規格 §2.4 版權區隔項
    expect(XIAO_HONG_DO_NOT).toContain("the number 95");
    expect(XIAO_HONG_DO_NOT).toContain("lightning bolt decal");
    expect(XIAO_HONG_DO_NOT).toContain("low-slung streamlined sports car body");
    expect(XIAO_HONG_DO_NOT).toContain("mouth built into the radiator grille");
    expect(XIAO_HONG_DO_NOT).toContain("Lightning McQueen");
    expect(XIAO_HONG_SILHOUETTE_TEST).toContain("silhouette");
  });

  it("正向特徵與定裝照一致：白條紋、號碼 2、單一尾翼、無天線", () => {
    expect(XIAO_HONG_IDENTITY).toContain("the number 2 in a white circle");
    expect(XIAO_HONG_IDENTITY).toContain("a white racing stripe");
    expect(XIAO_HONG_IDENTITY).toContain("a single rear spoiler");
    expect(XIAO_HONG_IDENTITY).toContain("no roof antenna");
    // 定裝照沒有黃條紋與天線，正向敘述不得偷渡進來
    expect(XIAO_HONG_IDENTITY).not.toMatch(/yellow (racing )?stripe/i);
    expect(XIAO_HONG_IDENTITY).not.toMatch(/star antenna/i);
  });

  it("小紅賽車的 desc 帶著 canon 設定書與 Do-NOT 清單", () => {
    const desc = descOf("小紅賽車");
    expect(desc).toContain(XIAO_HONG_FACE_LAYOUT);
    expect(desc).toContain(XIAO_HONG_IDENTITY);
    expect(desc).toContain(XIAO_HONG_DO_NOT);
    expect(desc).toContain(XIAO_HONG_SILHOUETTE_TEST);
    expect(desc.endsWith(xiaoHongDescSuffix())).toBe(true);
  });

  it("三個對 ep-23／ep-24 已出圖的連貫性鎖沒有被動到", () => {
    // 這三個條目明文寫死臉部配置以對齊已出圖的畫面；canon 裁決後更不得改動。
    expect(descOf("小紅賽車的爸爸")).toContain("eyes ONLY on the windshield");
    expect(descOf("小紅賽車年幼版")).toContain("eyes are NOT headlights on the bumper");
    expect(descOf("小紅賽車的爸爸年輕版")).toContain("copy reference dad 1:1");
  });

  it("roamer prompt：front 掛臉部配置，rear 不掛（背面看不到臉）", () => {
    const source = readFileSync(join(ROOT, "scripts/generate-roamer-assets.ts"), "utf8");
    const xiaoHong = source.slice(
      source.indexOf('id: "xiao-hong"'),
      source.indexOf('id: "duo-duo"'),
    );
    expect(xiaoHong).not.toBe("");
    const [front, rear] = xiaoHong.split("rear: {");
    expect(rear).toBeDefined();
    // front：臉部配置＋識別特徵＋瞇眼測試＋Do-NOT
    expect(front).toContain("XIAO_HONG_FACE_LAYOUT");
    expect(front).toContain("XIAO_HONG_IDENTITY");
    expect(front).toContain("XIAO_HONG_DO_NOT");
    // rear：背面視角刻意不描述臉，且 negative 已擋正面
    expect(rear).not.toContain("XIAO_HONG_FACE_LAYOUT");
    expect(rear).toContain("XIAO_HONG_IDENTITY");
    expect(rear).toContain("XIAO_HONG_DO_NOT");
    expect(rear).toContain("front face visible, eyes facing camera");
  });
});
