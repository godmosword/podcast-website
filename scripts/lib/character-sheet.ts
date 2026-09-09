/**
 * 小紅賽車家族角色設定書（生圖用 SSOT）。
 *
 * 背景：`data/characters.json` 的 `desc` 與 `generate-roamer-assets.ts` 的 prompt
 * 原本只寫「big round eyes and a cheerful smile」這類泛描述，未鎖任何自有識別特徵，
 * 模型因此容易回落到通用卡通車樣板（該樣板訓練資料大量來自《Cars》）。本檔把
 * 「已經是 canon 的特徵」寫成單一來源，讓每次生圖都帶上，並附掛 Do-NOT 清單。
 *
 * 規格全文見 `docs/specs/HERO-PARALLAX-SPEC.md` §2。
 *
 * ── 範圍紅線 ──
 * 本檔只**鎖定既有 canon**，不改變它。設定書中三項會推翻既有 canon 的項目
 * （眼睛改放大燈、加黃色條紋、加車頂星星天線）**刻意不寫進來**，因為：
 *
 *   1. 定裝照 `public/characters/小紅賽車.jpg` 是擋風玻璃眼＋黃色圓大燈（兩者分離）、
 *      白色雙條紋、無天線；
 *   2. `小紅賽車的爸爸`／`小紅賽車年幼版`／`小紅賽車的爸爸年輕版` 三個條目的 `desc`
 *      明文寫死 `eyes ONLY on the windshield`／`copy reference 1:1`，是對 ep-23／ep-24
 *      已出圖的連貫性鎖；
 *   3. 生圖管線會把 `ref` 定裝照一併送出，文字與參考圖若牴觸，結果不可預期。
 *
 * 要改這三項＝宣告既有角色圖庫與約 24 集插圖全數過期，屬付費重抽＋人工審圖，
 * 須由維護者裁決。見 `docs/specs/HERO-PARALLAX-SPEC.md` §2.5。
 */

/**
 * 自有識別特徵（正向）。
 *
 * 每一項都已存在於 `public/characters/小紅賽車.jpg`，寫進 prompt 是「鎖定」而非
 * 「變更」，因此與 `ref` 參考圖不會打架。
 */
export const XIAO_HONG_IDENTITY =
  "Self-identifying features that must all be present: a rounded, tall, chubby super-deformed " +
  "toy-car silhouette (NOT a low-slung streamlined sports car); the number 2 in a white circle " +
  "on the side door; a white racing stripe down the middle of the hood; small round yellow " +
  "headlights on the front, kept separate from the eyes; a soft smile line low on the front " +
  "bumper below the headlights; a single rear spoiler; blue accents on the bumper and trim.";

/**
 * Do-NOT 清單（負向）。
 *
 * 依規格 §2.4，每次生圖必附。`eyes on the windshield` **不在**此清單內——那是既有
 * canon，見檔頭範圍紅線。
 */
export const XIAO_HONG_DO_NOT =
  "the number 95, lightning bolt decal, sponsor decals, low-slung streamlined sports car body, " +
  "wide flat rally or off-road stance, oversized wheels, mouth built into the radiator grille, " +
  "Pixar Cars, Lightning McQueen, any car that reads at a glance as a Disney/Pixar Cars character";

/**
 * 瞇眼測試的驗收語（規格 §2.4）。放在正向 prompt 尾端，提醒模型剪影本身要可區辨。
 */
export const XIAO_HONG_SILHOUETTE_TEST =
  "The silhouette alone must read as this original character and clearly not as Lightning McQueen.";

/** 組給 `data/characters.json` 的 `desc` 用（該管線無獨立 negative 欄位，須內嵌）。 */
export function xiaoHongDescSuffix(): string {
  return ` ${XIAO_HONG_IDENTITY} Do NOT draw: ${XIAO_HONG_DO_NOT}. ${XIAO_HONG_SILHOUETTE_TEST}`;
}
