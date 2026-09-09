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
 * ── 基準（2026-09-09 裁決）──
 * **canon 是定裝照 `public/characters/小紅賽車.jpg`，不是任何文字設定書。**
 * 早期設定書曾把「眼睛放在大燈位置／白＋黃條紋／車頂星星天線」列為不可變動，但那三項
 * 與定裝照相反，已作廢：
 *
 *   1. 定裝照是擋風玻璃大眼，黃色圓大燈另外分離存在於車頭；引擎蓋只有白色雙條紋；無天線。
 *   2. `小紅賽車的爸爸`／`小紅賽車年幼版`／`小紅賽車的爸爸年輕版` 三個條目的 `desc`
 *      明文寫死 `eyes ONLY on the windshield`／`copy reference 1:1`，是對 ep-23／ep-24
 *      已出圖的連貫性鎖。
 *   3. 小紅賽車橫跨 ep-3／15／16／18／23／24，改臉會讓同一角色在故事庫中前後不一致。
 *   4. 生圖管線會把 `ref` 定裝照一併送出，文字與參考圖若牴觸，結果不可預期。
 *
 * 版權區隔改由圓潤高車身剪影、白圓底號碼 2、單一尾翼、與眼睛分離的黃大燈，以及
 * `XIAO_HONG_DO_NOT` 承擔；眼位不再是區隔手段。見 `HERO-PARALLAX-SPEC.md` §2.5。
 */

/**
 * canon 臉部配置（正向）。
 *
 * 與同族三個變體的 `desc` 採同一種寫法：把配置寫死，避免模型把大燈讀成眼睛。
 */
export const XIAO_HONG_FACE_LAYOUT =
  "FACE LAYOUT (canonical, match the reference portrait): big round eyes with black pupils and a " +
  "highlight sit ON THE WINDSHIELD panel; small round yellow headlights sit separately on the front " +
  "nose and are NOT the eyes — both must be present at once; a soft smile line runs low across the " +
  "front bumper, below the headlights.";

/**
 * 自有識別特徵（正向）。
 *
 * 每一項都已存在於定裝照，寫進 prompt 是「鎖定」而非「變更」，因此與 `ref` 不會打架。
 */
export const XIAO_HONG_IDENTITY =
  "Self-identifying features that must all be present: a rounded, tall, chubby super-deformed " +
  "toy-car silhouette (NOT a low-slung streamlined sports car); the number 2 in a white circle " +
  "on the side door; a white racing stripe down the middle of the hood; a single rear spoiler; " +
  "blue accents on the bumper and trim; no roof antenna.";

/**
 * Do-NOT 清單（負向）。
 *
 * 前三項擋的是「偏離 canon」的漂移，其餘為規格 §2.4 的版權區隔項。
 */
export const XIAO_HONG_DO_NOT =
  "eyes on the headlights, headlights used as eyes, missing headlights, roof antenna, star antenna, " +
  "yellow racing stripe, the number 95, lightning bolt decal, sponsor decals, low-slung streamlined " +
  "sports car body, wide flat rally or off-road stance, oversized wheels, mouth built into the " +
  "radiator grille, Pixar Cars, Lightning McQueen, any car that reads at a glance as a Disney/Pixar " +
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
