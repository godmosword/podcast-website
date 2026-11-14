/**
 * 小紅賽車角色設定書（生圖用 SSOT）。
 *
 * 背景：`data/characters.json` 的 `desc` 與 `generate-roamer-assets.ts` 的 prompt
 * 原本只寫「big round eyes and a cheerful smile」這類泛描述，未鎖任何自有識別特徵，
 * 模型因此容易回落到通用卡通車樣板（該樣板訓練資料大量來自《Cars》）。本檔把 canon
 * 寫成單一來源，讓每次生圖都帶上，並附掛 Do-NOT 清單。
 *
 * 規格全文見 `docs/specs/HERO-PARALLAX-SPEC.md` §2。
 *
 * ── 基準（2026-11-14 定裝照）──
 * **canon 是定裝照 `public/characters/小紅賽車.jpg`，不是任何文字設定書。**
 * 2026-09-09 曾依當時定裝照鎖成「擋風玻璃大眼、分離黃大燈、引擎蓋白條紋、無天線」。
 * 2026-11-14 定裝照換成附圖後，識別改跟新圖：白擋風玻璃上的藍虹膜大眼、分離的藍色圓大燈、
 * 引擎蓋純紅沒有條紋、號碼 2 只在車門、藍後照鏡、藍胎白輪毂、單一紅尾翼、無天線。
 *
 *   1. 新定裝照是白擋風玻璃大眼，藍色圓大燈另外分離存在於車頭兩側；引擎蓋沒有條紋；無天線。
 *   2. `紅爸` 定裝照同日換成附圖（黑框眼鏡、棕翹鬍子、張嘴），`小紅賽車年幼版`
 *      換成附圖（青綠奶嘴、藍大燈、藍胎、沒有號碼）；`desc` 都跟新圖。
 *      `小紅賽車的爸爸年輕版` 已從圖鑑名冊移除，不再生圖。
 *   3. 已出的故事插畫、地圖漫遊圖與 Hero 建模不因換定裝照而重繪。
 *   4. 生圖管線會把 `ref` 定裝照一併送出，文字與參考圖若牴觸，結果不可預期。
 *
 * 版權區隔改由圓潤高車身剪影、白圓底號碼 2、單一尾翼、與眼睛分離的藍大燈，以及
 * `XIAO_HONG_DO_NOT` 承擔；眼位不再是區隔手段。見 `HERO-PARALLAX-SPEC.md` §2.5。
 * 圖內禁文字的唯一例外就是這個「2」（見 coloring-ai-prompts.ts 與 CLAY_NEGATIVE）。
 */

/**
 * canon 臉部配置（正向）。
 *
 * 與同族三個變體的 `desc` 採同一種寫法：把配置寫死，避免模型把大燈讀成眼睛。
 */
export const XIAO_HONG_FACE_LAYOUT =
  "FACE LAYOUT (canonical, match the reference portrait): big round eyes with blue irises, black pupils and a " +
  "highlight sit ON THE WINDSHIELD panel; round blue headlights with pale centers sit separately on the front " +
  "fenders and are NOT the eyes — both must be present at once; a soft closed smile line runs low across the " +
  "front bumper, below the headlights.";

/**
 * 自有識別特徵（正向）。
 *
 * 每一項都已存在於定裝照，寫進 prompt 是「鎖定」而非「變更」，因此與 `ref` 不會打架。
 */
export const XIAO_HONG_IDENTITY =
  "Self-identifying features that must all be present: a rounded, tall, chubby super-deformed " +
  "toy-car silhouette (NOT a low-slung streamlined sports car); the number 2 in a white circle " +
  "on the side door only, with no number on the hood; a solid red hood with no racing stripe; a single rear spoiler; " +
  "blue round side mirrors; a white side window; blue tires with white hubcaps; no roof antenna.";

/**
 * Do-NOT 清單（負向）。
 *
 * 前三項擋的是「偏離 canon」的漂移，其餘為規格 §2.4 的版權區隔項。
 */
export const XIAO_HONG_DO_NOT =
  "eyes on the headlights, headlights used as eyes, missing headlights, yellow headlights, white racing stripe, " +
  "hood racing number, roof antenna, star antenna, " +
  "yellow racing stripe, the number 95, lightning bolt decal, sponsor decals, low-slung streamlined " +
  "sports car body, wide flat rally or off-road stance, oversized wheels, mouth built into the " +
  "radiator grille, open mouth with a tongue, Pixar Cars, Lightning McQueen, any car that reads at a glance as a Disney/Pixar " +
  "Cars character";

/**
 * 瞇眼測試的驗收語（規格 §2.4）。放在正向 prompt 尾端，提醒模型剪影本身要可區辨。
 */
export const XIAO_HONG_SILHOUETTE_TEST =
  "The silhouette alone must read as this original character and clearly not as Lightning McQueen.";

/** 組給 `data/characters.json` 的 `desc` 用（該管線無獨立 negative 欄位，須內嵌）。 */
export function xiaoHongDescSuffix(): string {
  return (
    ` ${XIAO_HONG_FACE_LAYOUT} ${XIAO_HONG_IDENTITY}` +
    ` Do NOT draw: ${XIAO_HONG_DO_NOT}. ${XIAO_HONG_SILHOUETTE_TEST}`
  );
}
