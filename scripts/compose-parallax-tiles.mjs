#!/usr/bin/env node
/**
 * 把 Phase 4 的黏土零件表合成為橫向 2.5D 視差帶的可平鋪 tile。
 *
 * 規格見 docs/specs/HERO-PARALLAX-SPEC.md §4；生圖 prompts 與根因見
 * assets/landing/hero-parallax/PHASE4-ASSET-PROMPTS.md。
 *
 * 為什麼需要這支腳本：規格 §4.3 原本要求「每層輸出為可無縫左右接合的 tile」，
 * 但影像模型做不到——出不了 1920px 長條，也無法保證左右邊緣對齊。改成生「透明底
 * 的個別零件」，由這裡排進固定寬度的畫布並在左右各留空白，接縫落在空白處，
 * 無縫是靠構造保證而不是靠模型。
 *
 * L3 路面是唯一沒有空白緩衝的層（它必須連續），所以另外走三道處理：
 *   1. 色彩校正到 Art Bible 的步道色；
 *   2. 裁成「間隙中點起算、整數個虛線週期」，否則首尾兩截半條虛線會併成雙倍長；
 *   3. 一個週期寬的預乘 alpha 交叉淡接，消掉手捏草皮上緣的輪廓階差。
 *
 * 用法：node scripts/compose-parallax-tiles.mjs [--verify]
 *   --verify 另外輸出接縫對照圖到 assets/landing/hero-parallax/verify/
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const PROPS = path.join(ROOT, "assets/landing/hero-parallax/props");
const OUT = path.join(ROOT, "public/landing/hero-parallax");
const VERIFY = path.join(ROOT, "assets/landing/hero-parallax/verify");
const WANT_VERIFY = process.argv.includes("--verify");

/** Hero 底色，只用於驗證圖的合成背景；上線時底色由 CSS 漸層提供。 */
const HERO_CREAM = "#faf1e4";

/**
 * 零件表 tile 的固定寬度（規格 §4.3 的 1920 CSS px，這裡直接以實際像素輸出）。
 * 刻意不放大到 2x：零件的原生解析度就在這個量級，放大只會變糊。
 */
const TILE_WIDTH = 1920;
/** 左右各留的空白，接縫就落在這裡面。 */
const EDGE_MARGIN = 120;

/**
 * 各層的擺放參數。`scale` 是零件相對原生尺寸的縮放，決定該層在景深裡的份量；
 * `saturation` 補生圖沒做出來的飽和度階梯（實測 L1 與 L2 的綠幾乎同飽和，
 * 景深只靠亮度撐著）。這些是美術旋鈕，調這裡不用重新生圖。
 */
const LAYERS = {
  L1: { scale: 0.42, saturation: 0.85, label: "遠景地標" },
  L2: { scale: 0.55, saturation: 1.0, label: "中景" },
  L5: { scale: 0.78, saturation: 1.0, label: "近景" },
};

/**
 * L3 路面的目標色。`#d7c596` 是 UNIVERSE-ART-BIBLE.md §4 的步道色，也是既有
 * 宇宙地圖用的同一個色票；生圖給的是 `#a47846`，明顯更深更橘，與站上其他素材不同調。
 */
const ROAD_TARGET = { r: 0xd7, g: 0xc5, b: 0x96 };

const readRaw = async (file) =>
  sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

const rgbToHsl = (r, g, b) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h, s, l];
};

const hslToRgb = (h, s, l) => {
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue = (t) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [hue(h + 1 / 3), hue(h), hue(h - 1 / 3)].map((v) =>
    Math.max(0, Math.min(255, Math.round(v * 255))));
};

/** 路面的棕色像素判定；草皮與奶油色虛線不吃色彩校正。 */
const isRoadPixel = (r, g, b) => r > g && g > b && r - b > 40;

/**
 * 只校正色相落在路面主色附近的像素。草／路交界的橄欖色同樣滿足 r>g>b，若不加這道
 * 窗，大幅移色相會把那一圈染成螢光黃。實測交界像素的色相約在 50°，路面本體約 32°。
 */
const HUE_WINDOW = 0.03;
/**
 * 校正強度。1 = 完全對齊 ROAD_TARGET，實測會把質感洗得太平；0.78 保住手捏起伏。
 */
const RECOLOUR_STRENGTH = 0.78;

/**
 * 把路面色移到 `ROAD_TARGET`。在 HSL 空間做，而不是直接乘增益——實測線性增益會
 * 把路面洗成近白、虛線爆掉失去邊緣、質感全平。色相與飽和用比例、亮度用位移，
 * 位移量在亮部逐漸收斂以避免削頂。
 */
function recolourRoad(data, width, height) {
  let hs = 0, ss = 0, ls = 0, n = 0;
  for (let i = 0; i < width * height; i++) {
    if (data[i * 4 + 3] < 250) continue;
    const [r, g, b] = [data[i * 4], data[i * 4 + 1], data[i * 4 + 2]];
    if (!isRoadPixel(r, g, b)) continue;
    const [h, s, l] = rgbToHsl(r, g, b);
    hs += h; ss += s; ls += l; n++;
  }
  if (!n) return { moved: 0 };
  const cur = { h: hs / n, s: ss / n, l: ls / n };
  const [th, ts, tl] = rgbToHsl(ROAD_TARGET.r, ROAD_TARGET.g, ROAD_TARGET.b);
  const k = RECOLOUR_STRENGTH;
  const dh = (th - cur.h) * k;
  const sGain = 1 + (ts / cur.s - 1) * k;
  const dl = (tl - cur.l) * k;

  // 先建遮罩，再侵蝕一圈。不侵蝕的話，緊貼草皮與底緣裁切線的過渡像素會被一起
  // 校色，在交界留下一條螢光黃的邊。
  const mask = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    if (data[i * 4 + 3] < 250) continue;
    const [r, g, b] = [data[i * 4], data[i * 4 + 1], data[i * 4 + 2]];
    if (!isRoadPixel(r, g, b)) continue;
    const [h] = rgbToHsl(r, g, b);
    if (Math.abs(h - cur.h) > HUE_WINDOW) continue;
    mask[i] = 1;
  }
  const eroded = new Uint8Array(mask);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      if (!mask[i]) continue;
      if (!mask[i - 1] || !mask[i + 1] || !mask[i - width] || !mask[i + width]) eroded[i] = 0;
    }
  }

  let moved = 0;
  for (let i = 0; i < width * height; i++) {
    if (!eroded[i]) continue;
    const [h, s, l] = rgbToHsl(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
    // 亮部收斂：l 越接近 1，提亮量越小，避免把質感的亮點推到削頂。
    const lift = dl * ((1 - l) / (1 - cur.l));
    const [nr, ng, nb] = hslToRgb(
      (h + dh + 1) % 1,
      Math.max(0, Math.min(1, s * sGain)),
      Math.max(0, Math.min(1, l + lift)),
    );
    data[i * 4] = nr; data[i * 4 + 1] = ng; data[i * 4 + 2] = nb;
    moved++;
  }
  return { moved, from: cur, to: { h: th, s: ts, l: tl } };
}

/**
 * 找出中線虛線的位置與週期。回傳每段虛線的 [起, 迄]，以及平均週期。
 * 用「奶油色亮條命中最多的那一列」當取樣列，避免猜座標。
 */
function findDashes(data, width, height, contentTop, contentBottom) {
  const isCream = (i) =>
    data[i + 3] > 200 && data[i] > 195 && data[i + 1] > 180 &&
    data[i + 2] > 150 && data[i + 1] > data[i + 2] + 10;
  let row = -1, bestHits = 0;
  for (let y = contentTop; y <= contentBottom; y++) {
    let hits = 0;
    for (let x = 0; x < width; x++) if (isCream((y * width + x) * 4)) hits++;
    if (hits > bestHits) { bestHits = hits; row = y; }
  }
  if (row < 0) return null;
  const segments = [];
  let start = -1;
  for (let x = 0; x < width; x++) {
    const on = isCream((row * width + x) * 4);
    if (on && start < 0) start = x;
    else if (!on && start >= 0) { if (x - start > 6) segments.push([start, x - 1]); start = -1; }
  }
  if (start >= 0) segments.push([start, width - 1]);
  if (segments.length < 4) return null;
  const centres = segments.map(([a, b]) => (a + b) / 2);
  // 頭尾可能是半截，週期只取中間段
  const gaps = [];
  for (let i = 2; i < centres.length - 1; i++) gaps.push(centres[i] - centres[i - 1]);
  const period = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  return { row, segments, period };
}

/** 內容的垂直範圍（alpha > 32 的第一與最後一列）。 */
function contentBounds(data, width, height) {
  let top = height, bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 32) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        break;
      }
    }
  }
  return { top, bottom };
}

/**
 * 一個 fade 寬的交叉淡接，讓 tile 首尾可以無縫相接。
 *
 * 必須在**預乘 alpha** 空間混色：直接混 RGB 會在「草皮／透空」交界產生半透明的
 * 綠色鬼影，因為透空側的 RGB 是無意義的殘值。
 */
function crossFade(data, width, height, fade) {
  const outW = width - fade;
  const out = Buffer.alloc(outW * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < outW; x++) {
      const o = (y * outW + x) * 4;
      const a = (y * width + x) * 4;
      const b = (y * width + outW + x) * 4;
      if (x < fade) {
        const t = x / fade;
        const aA = data[a + 3] / 255, aB = data[b + 3] / 255;
        const outA = aA * t + aB * (1 - t);
        for (let c = 0; c < 3; c++) {
          const premul = data[a + c] * aA * t + data[b + c] * aB * (1 - t);
          out[o + c] = outA > 1e-4 ? Math.min(255, Math.round(premul / outA)) : 0;
        }
        out[o + 3] = Math.round(outA * 255);
      } else {
        for (let c = 0; c < 4; c++) out[o + c] = data[a + c];
      }
    }
  }
  return { buffer: out, width: outW };
}

/** 零件表上每個物件的水平範圍。 */
function objectSpans(data, width, height, minWidth = 15) {
  const has = [];
  for (let x = 0; x < width; x++) {
    let hit = false;
    for (let y = 0; y < height; y++) {
      if (data[(y * width + x) * 4 + 3] > 32) { hit = true; break; }
    }
    has.push(hit);
  }
  const spans = [];
  let start = -1;
  for (let x = 0; x < width; x++) {
    if (has[x] && start < 0) start = x;
    else if (!has[x] && start >= 0) { if (x - start > minWidth) spans.push([start, x - 1]); start = -1; }
  }
  if (start >= 0 && width - start > minWidth) spans.push([start, width - 1]);
  return spans;
}

async function buildRoad() {
  const src = path.join(PROPS, "L3.png");
  const { data, info } = await readRaw(src);
  const { width, height } = info;
  const bounds = contentBounds(data, width, height);

  // 順序不可調換：校色會把路面提亮到接近奶油色，之後虛線的亮色判定會把整條路面
  // 都當成虛線，週期會抓成質感斑點的間距（實測 42px，正解是 163px）。
  const dashes = findDashes(data, width, height, bounds.top, bounds.bottom);
  if (!dashes) throw new Error("L3：找不到中線虛線，無法對齊週期");
  const colour = recolourRoad(data, width, height);

  // 從「間隙中點」起裁，長度取整數個週期，首尾才不會各留半截虛線。
  const period = dashes.period;
  const first = dashes.segments[1], second = dashes.segments[2];
  const cutStart = Math.round((first[1] + second[0]) / 2);
  const periods = Math.floor((width - cutStart) / period);
  const cutWidth = Math.round(periods * period);

  const cropped = await sharp(data, { raw: { width, height, channels: 4 } })
    .extract({ left: cutStart, top: 0, width: cutWidth, height })
    .raw().toBuffer({ resolveWithObject: true });

  // 淡接寬 = 剛好一個週期，混色區間內的虛線相位才對得上。
  const fade = Math.round(period);
  const faded = crossFade(cropped.data, cutWidth, height, fade);

  const outFile = path.join(OUT, "l3-road.webp");
  await sharp(faded.buffer, { raw: { width: faded.width, height, channels: 4 } })
    .webp({ quality: 92, alphaQuality: 100 }).toFile(outFile);

  return {
    layer: "L3", file: outFile, width: faded.width, height,
    period: period.toFixed(1), periods: periods - 1, cutStart, fade,
    recoloured: colour.moved,
    edgeDelta: edgeDelta(faded.buffer, faded.width, height),
  };
}

/** 左右邊緣的 RGBA 平均差，用來量化「接得多準」。 */
function edgeDelta(buf, width, height) {
  let sum = 0, max = 0;
  for (let y = 0; y < height; y++) {
    const l = y * width * 4, r = (y * width + width - 1) * 4;
    let d = 0;
    for (let c = 0; c < 4; c++) d += Math.abs(buf[l + c] - buf[r + c]);
    sum += d; if (d > max) max = d;
  }
  return { mean: +(sum / height).toFixed(1), max };
}

async function buildPropLayer(name) {
  const cfg = LAYERS[name];
  const src = path.join(PROPS, `${name}.png`);
  const { data, info } = await readRaw(src);
  const spans = objectSpans(data, info.width, info.height);
  if (!spans.length) throw new Error(`${name}：找不到任何零件`);

  // 逐件裁出並依層級縮放
  const pieces = [];
  for (const [x0, x1] of spans) {
    let top = info.height, bottom = -1;
    for (let y = 0; y < info.height; y++) {
      for (let x = x0; x <= x1; x++) {
        if (data[(y * info.width + x) * 4 + 3] > 32) {
          if (y < top) top = y;
          if (y > bottom) bottom = y;
          break;
        }
      }
    }
    const w = x1 - x0 + 1, h = bottom - top + 1;
    let pipe = sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
      .extract({ left: x0, top, width: w, height: h })
      .resize(Math.max(1, Math.round(w * cfg.scale)), Math.max(1, Math.round(h * cfg.scale)));
    if (cfg.saturation !== 1) pipe = pipe.modulate({ saturation: cfg.saturation });
    const buf = await pipe.png().toBuffer();
    const m = await sharp(buf).metadata();
    pieces.push({ buffer: buf, width: m.width, height: m.height });
  }

  // 在左右各留 EDGE_MARGIN 的空白裡均分零件；接縫落在空白處，所以無縫。
  const usable = TILE_WIDTH - EDGE_MARGIN * 2;
  const total = pieces.reduce((a, p) => a + p.width, 0);
  const gap = (usable - total) / (pieces.length - 1 || 1);
  if (gap < 0) throw new Error(`${name}：零件總寬 ${total}px 超過可用寬 ${usable}px，請調低 scale`);

  const tileH = Math.max(...pieces.map((p) => p.height)) + 8;
  const composites = [];
  let x = EDGE_MARGIN;
  for (const p of pieces) {
    // 底部對齊：視差帶的地平線是一條水平線，所有零件踩同一條基線。
    composites.push({ input: p.buffer, left: Math.round(x), top: tileH - 4 - p.height });
    x += p.width + gap;
  }

  const outFile = path.join(OUT, `${name.toLowerCase()}-props.webp`);
  await sharp({ create: { width: TILE_WIDTH, height: tileH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(composites)
    .webp({ quality: 92, alphaQuality: 100 })
    .toFile(outFile);

  return { layer: name, label: cfg.label, file: outFile, width: TILE_WIDTH, height: tileH, pieces: pieces.length, gap: Math.round(gap) };
}

/** 接縫對照圖：同一張 tile 左右並排兩份，裁接縫附近放大。 */
async function seamSheet(file, name) {
  const m = await sharp(file).metadata();
  const buf = await sharp(file).png().toBuffer();
  const tiled = await sharp({ create: { width: m.width * 2, height: m.height, channels: 4, background: HERO_CREAM } })
    .composite([{ input: buf, left: 0, top: 0 }, { input: buf, left: m.width, top: 0 }])
    .png().toBuffer();
  const w = Math.min(900, m.width);
  await sharp(tiled)
    .extract({ left: m.width - Math.round(w / 2), top: 0, width: w, height: m.height })
    .resize(1400)
    .png()
    .toFile(path.join(VERIFY, `${name}-seam.png`));
}

async function main() {
  await mkdir(OUT, { recursive: true });
  if (WANT_VERIFY) await mkdir(VERIFY, { recursive: true });

  const results = [];
  results.push(await buildRoad());
  for (const name of ["L1", "L2", "L5"]) results.push(await buildPropLayer(name));

  if (WANT_VERIFY) {
    for (const r of results) await seamSheet(r.file, r.layer.toLowerCase());
  }

  for (const r of results) {
    const rel = path.relative(ROOT, r.file);
    if (r.layer === "L3") {
      console.log(`L3 路面   ${r.width}x${r.height}  虛線週期 ${r.period}px x${r.periods}  淡接 ${r.fade}px  校色 ${r.recoloured} 像素`);
      console.log(`          左右邊緣 RGBA 差 平均 ${r.edgeDelta.mean} / 最大 ${r.edgeDelta.max}`);
    } else {
      console.log(`${r.layer} ${r.label.padEnd(5)} ${r.width}x${r.height}  零件 ${r.pieces} 件  間距 ${r.gap}px  左右留白 ${EDGE_MARGIN}px`);
    }
    console.log(`          → ${rel}`);
  }

  await writeFile(
    path.join(OUT, "manifest.json"),
    JSON.stringify({
      generatedBy: "scripts/compose-parallax-tiles.mjs",
      tileWidth: TILE_WIDTH,
      edgeMargin: EDGE_MARGIN,
      roadTarget: ROAD_TARGET,
      layers: results.map((r) => ({
        layer: r.layer, file: path.relative(ROOT, r.file),
        width: r.width, height: r.height,
        ...(r.layer === "L3" ? { dashPeriod: r.period, fade: r.fade, edgeDelta: r.edgeDelta } : { pieces: r.pieces, scale: LAYERS[r.layer].scale, saturation: LAYERS[r.layer].saturation }),
      })),
    }, null, 2) + "\n",
  );
}

main().catch((err) => { console.error(err); process.exit(1); });
