import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import sharp from "sharp";
import {
  COLORING_BUCKET_LEAK_MAX,
  COLORING_FIDELITY,
  COLORING_GATES,
  COLORING_LINEART_MAX_SIDE,
  COLORING_MIDTONE_RATIO_MAX,
  SPECKLE_MAX_DIM,
  SPECKLE_MIN_AREA,
  convertToLineArt,
  despeckleInk,
  estimateBucketLeakRatio,
  evaluateLineArtGate,
  isMostlyWhiteBackground,
  labelInkComponents,
  measureCompositionFidelity,
  measureLineArtQuality,
  postprocessAiLineArt,
  subjectOutlineFromRgba,
} from "./coloring-lineart";

const SAMPLE = join(process.cwd(), "public/characters/恐龍車多多.jpg");
/** 問題頁回歸樣本（背景灌木／地面噪點最嚴重的 character 頁）。 */
const NOISY_SAMPLE = join(process.cwd(), "public/characters/鈴鈴清潔車.jpg");

describe("coloring-lineart converter", () => {
  test("產出白底黑線 PNG，長邊不大於上限", async () => {
    const input = readFileSync(SAMPLE);
    const result = await convertToLineArt(input);

    expect(result.width).toBeLessThanOrEqual(COLORING_LINEART_MAX_SIDE);
    expect(result.height).toBeLessThanOrEqual(COLORING_LINEART_MAX_SIDE);
    expect(result.buffer.byteLength).toBeGreaterThan(500);

    const meta = await sharp(result.buffer).metadata();
    expect(meta.format).toBe("png");
    expect(await isMostlyWhiteBackground(result.buffer)).toBe(true);
  });

  test("恐龍車多多線稿外框可填比低於漏色門檻", async () => {
    const input = readFileSync(SAMPLE);
    const result = await convertToLineArt(input);
    const leak = await estimateBucketLeakRatio(result.buffer);
    expect(leak).toBeLessThan(COLORING_BUCKET_LEAK_MAX);
  });

  test("鈴鈴清潔車（問題頁）過 character gate：噪點大減、輸出雙峰、漏色達標", async () => {
    const input = readFileSync(NOISY_SAMPLE);
    const result = await convertToLineArt(input);
    const q = await measureLineArtQuality(result.buffer);
    const gate = COLORING_GATES.character;

    expect(q.opaque).toBe(true);
    expect(q.midToneRatio).toBeLessThanOrEqual(COLORING_MIDTONE_RATIO_MAX);
    expect(q.speckleCount).toBeLessThanOrEqual(gate.speckleCountMax);
    expect(q.inkCoverage).toBeLessThanOrEqual(gate.inkCoverageMax);
    expect(q.exteriorLeakRatio).toBeLessThan(gate.leakMax);
  });

  test("subjectOutlineFromRgba 對實心圓產生閉合輪廓", () => {
    const w = 64;
    const h = 64;
    const data = Buffer.alloc(w * h * 4, 200); // 灰背景
    const cx = 32;
    const cy = 32;
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= 14 * 14) {
          const i = (y * w + x) * 4;
          data[i] = 220;
          data[i + 1] = 40;
          data[i + 2] = 40;
          data[i + 3] = 255;
        }
      }
    }
    const outline = subjectOutlineFromRgba(data, w, h, 4, 24);
    let ink = 0;
    for (const v of outline) if (v) ink += 1;
    expect(ink).toBeGreaterThan(40);
    // 圓心不應落在輪廓上
    expect(outline[cy * w + cx]).toBe(0);
  });
});

describe("despeckleInk", () => {
  const W = 100;
  const H = 100;

  function blank(): Uint8Array {
    return new Uint8Array(W * H);
  }

  test("移除小面積短小斑點", () => {
    const bin = blank();
    // 3×3 小斑（面積 9 < SPECKLE_MIN_AREA、邊長 3 ≤ SPECKLE_MAX_DIM）
    for (let y = 10; y < 13; y += 1) for (let x = 10; x < 13; x += 1) bin[y * W + x] = 1;
    const out = despeckleInk(bin, W, H);
    expect(out.every((v) => v === 0)).toBe(true);
    // 輸入不被就地修改
    expect(bin[10 * W + 10]).toBe(1);
  });

  test("保留細長真線（面積小但長度超過 bbox 上限）", () => {
    const bin = blank();
    // 1×30 橫線：面積 30 < SPECKLE_MIN_AREA(40)，但長度 30 > SPECKLE_MAX_DIM(12)
    expect(30).toBeLessThan(SPECKLE_MIN_AREA);
    expect(30).toBeGreaterThan(SPECKLE_MAX_DIM);
    for (let x = 20; x < 50; x += 1) bin[40 * W + x] = 1;
    const out = despeckleInk(bin, W, H);
    let kept = 0;
    for (const v of out) if (v) kept += 1;
    expect(kept).toBe(30);
  });

  test("保留大面積連通區", () => {
    const bin = blank();
    for (let y = 30; y < 40; y += 1) for (let x = 30; x < 40; x += 1) bin[y * W + x] = 1;
    const out = despeckleInk(bin, W, H);
    let kept = 0;
    for (const v of out) if (v) kept += 1;
    expect(kept).toBe(100);
  });

  test("labelInkComponents 用 8 鄰域（對角相連算同一區）", () => {
    const bin = blank();
    bin[10 * W + 10] = 1;
    bin[11 * W + 11] = 1;
    expect(labelInkComponents(bin, W, H)).toHaveLength(1);
  });
});

describe("measureCompositionFidelity／構圖 gate", () => {
  /** 白底＋指定位置的粗黑框方形（線稿；3px 描邊利於 edge IoU）。 */
  async function lineSquarePng(
    size: number,
    box: { x: number; y: number; w: number; h: number },
  ): Promise<Buffer> {
    const raw = Buffer.alloc(size * size * 3, 255);
    const stroke = (x: number, y: number) => {
      if (x < 0 || y < 0 || x >= size || y >= size) return;
      const i = (y * size + x) * 3;
      raw[i] = 0;
      raw[i + 1] = 0;
      raw[i + 2] = 0;
    };
    for (let t = 0; t < 3; t += 1) {
      for (let x = box.x; x < box.x + box.w; x += 1) {
        stroke(x, box.y + t);
        stroke(x, box.y + box.h - 1 - t);
      }
      for (let y = box.y; y < box.y + box.h; y += 1) {
        stroke(box.x + t, y);
        stroke(box.x + box.w - 1 - t, y);
      }
    }
    return sharp(raw, { raw: { width: size, height: size, channels: 3 } })
      .png()
      .toBuffer();
  }

  /** 對應位置的實心色塊（當參考彩圖，邊緣可被 Laplacian 抓到）。 */
  async function colorBlockPng(
    size: number,
    box: { x: number; y: number; w: number; h: number },
    fill: [number, number, number],
  ): Promise<Buffer> {
    const raw = Buffer.alloc(size * size * 3, 240);
    for (let y = box.y; y < box.y + box.h; y += 1) {
      for (let x = box.x; x < box.x + box.w; x += 1) {
        const i = (y * size + x) * 3;
        raw[i] = fill[0];
        raw[i + 1] = fill[1];
        raw[i + 2] = fill[2];
      }
    }
    return sharp(raw, { raw: { width: size, height: size, channels: 3 } })
      .png()
      .toBuffer();
  }

  test("對齊構圖的線稿 edgeIou 高於錯位構圖", async () => {
    const size = 128;
    const box = { x: 24, y: 24, w: 80, h: 80 };
    const ref = await colorBlockPng(size, box, [220, 40, 40]);
    const aligned = await lineSquarePng(size, box);
    const mismatched = await lineSquarePng(size, { x: 4, y: 4, w: 28, h: 28 });

    const good = await measureCompositionFidelity(aligned, ref);
    const bad = await measureCompositionFidelity(mismatched, ref);

    expect(good.edgeIou).toBeGreaterThan(COLORING_FIDELITY.scene.minEdgeIou);
    expect(bad.edgeIou).toBeLessThan(COLORING_FIDELITY.scene.minEdgeIou);
    expect(good.edgeIou).toBeGreaterThan(bad.edgeIou);
  });

  test("scene＋參考圖：構圖過低 → gate 失敗", async () => {
    const size = 128;
    const ref = await colorBlockPng(size, { x: 40, y: 40, w: 70, h: 70 }, [40, 120, 220]);
    // 閉合外框＋角落錯位濃線團（與中央色塊參考構圖不合；可能 ink 過低故補外框）
    const raw = Buffer.alloc(size * size * 3, 255);
    const put = (x: number, y: number) => {
      const i = (y * size + x) * 3;
      raw[i] = 0;
      raw[i + 1] = 0;
      raw[i + 2] = 0;
    };
    for (let x = 8; x < 120; x += 1) {
      put(x, 8);
      put(x, 119);
    }
    for (let y = 8; y < 120; y += 1) {
      put(8, y);
      put(119, y);
    }
    // 錯位濃線團在角落（與中央色塊參考構圖不合）
    for (let y = 10; y < 36; y += 1) for (let x = 10; x < 36; x += 1) if ((x + y) % 2 === 0) put(x, y);
    const line = await sharp(raw, { raw: { width: size, height: size, channels: 3 } })
      .png()
      .toBuffer();

    const fidelity = await measureCompositionFidelity(line, ref);
    expect(fidelity.edgeIou).toBeLessThan(COLORING_FIDELITY.scene.minEdgeIou);

    const gate = await evaluateLineArtGate(line, "scene", { referenceBuffer: ref });
    expect(gate.compositionScore).toBeDefined();
    expect(gate.ok).toBe(false);
    expect(gate.problems.some((p) => p.includes("構圖相似度"))).toBe(true);
  });

  test("character＋參考圖：構圖偏低只進 warnings、不擋 ok（其他 gate 通過時）", async () => {
    const size = 160;
    // 乾淨大閉合框（通過 fillable／leak）＋角落錯位細節 → 相對中央色塊參考偏低
    const raw = Buffer.alloc(size * size * 3, 255);
    const put = (x: number, y: number) => {
      const i = (y * size + x) * 3;
      raw[i] = 0;
      raw[i + 1] = 0;
      raw[i + 2] = 0;
    };
    for (let x = 20; x < 140; x += 1) {
      put(x, 20);
      put(x, 139);
    }
    for (let y = 20; y < 140; y += 1) {
      put(20, y);
      put(139, y);
    }
    for (let y = 24; y < 48; y += 1) for (let x = 24; x < 48; x += 1) if ((x + y) % 3 === 0) put(x, y);
    const line = await sharp(raw, { raw: { width: size, height: size, channels: 3 } })
      .png()
      .toBuffer();
    const ref = await colorBlockPng(size, { x: 50, y: 50, w: 80, h: 80 }, [200, 60, 60]);

    const withoutRef = await evaluateLineArtGate(line, "character");
    expect(withoutRef.ok).toBe(true);

    const withRef = await evaluateLineArtGate(line, "character", { referenceBuffer: ref });
    // 錯位時應有構圖警告；若分數意外偏高則至少不應 hard-fail
    if ((withRef.compositionScore ?? 1) < COLORING_FIDELITY.character.warnEdgeIou) {
      expect(withRef.warnings.some((w) => w.includes("構圖相似度"))).toBe(true);
    }
    expect(withRef.problems.some((p) => p.includes("構圖相似度"))).toBe(false);
    expect(withRef.ok).toBe(withoutRef.ok);
  });

  test("未提供 referenceBuffer 時不跑構圖檢查（現役資產契約相容）", async () => {
    const line = await lineSquarePng(64, { x: 8, y: 8, w: 48, h: 48 });
    const gate = await evaluateLineArtGate(line, "scene");
    expect(gate.compositionScore).toBeUndefined();
    expect(gate.warnings).toEqual([]);
  });
});

describe("postprocessAiLineArt（合成 fixture，免真 API）", () => {
  test("透明底＋灰陰影＋細縫 → 不透明 1024 方圖、雙峰黑白、縫被封", async () => {
    const w = 512;
    const h = 512;
    const raw = Buffer.alloc(w * h * 4, 0); // 全透明
    const put = (x: number, y: number, v: number, a = 255) => {
      const i = (y * w + x) * 4;
      raw[i] = v;
      raw[i + 1] = v;
      raw[i + 2] = v;
      raw[i + 3] = a;
    };
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        put(x, y, 255); // 白底
      }
    }
    // 黑框（留 2px 缺口，morph close 應封閉）＋中央灰陰影塊
    for (let x = 100; x < 400; x += 1) {
      if (x < 248 || x > 250) put(x, 100, 0);
      put(x, 400, 0);
    }
    for (let y = 100; y < 400; y += 1) {
      put(100, y, 0);
      put(400, y, 0);
    }
    for (let y = 200; y < 260; y += 1) for (let x = 200; x < 260; x += 1) put(x, y, 190);
    // 左上角一塊半透明像素
    for (let y = 0; y < 8; y += 1) for (let x = 0; x < 8; x += 1) put(x, y, 128, 120);

    const rawPng = await sharp(raw, { raw: { width: w, height: h, channels: 4 } })
      .png()
      .toBuffer();
    const out = await postprocessAiLineArt(rawPng);
    const q = await measureLineArtQuality(out);

    expect(q.width).toBe(1024);
    expect(q.height).toBe(1024);
    expect(q.opaque).toBe(true);
    // 灰陰影（190）應歸白、無中間帶殘留
    expect(q.midToneRatio).toBeLessThanOrEqual(COLORING_MIDTONE_RATIO_MAX);
    // 框有缺口但經 morph close 封閉：外框洪水不得灌進框內
    expect(q.exteriorLeakRatio).toBeLessThan(COLORING_BUCKET_LEAK_MAX);
  });
});
