/**
 * Intro → Landing 的進站契約（PLAN Phase 9 / SPEC §5.3、§9）。
 *
 * 決策都寫成純函式，因為它們是產品契約：原生連結語意、單次導航、以及
 * 「動畫永遠不是導航的前置條件」都必須能在不啟動 WebGL 的情況下被測試。
 */

/** 視覺轉場的硬上限；CSS 淡出與相機推近共用這個數字。 */
export const EXIT_TRANSITION_MS = 360;
/** 轉場沒能完成（route chunk 失敗）時把原生連結還給使用者的保底。 */
export const TRANSITION_RESET_MS = 1_500;

export type EnterActivation = {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  /** 場景已成功算繪至少一幀。 */
  ready: boolean;
  /** 通過 reduced motion／Save-Data／WebGL 等前置條件，3D 允許存在。 */
  eligible: boolean;
  failed: boolean;
  reducedMotion: boolean;
  /** 這次點擊之前已經開始導航。 */
  navigating: boolean;
  /**
   * `page` 是 `/intro` 獨立頁；`overlay` 是首頁上的同頁覆蓋層（ADR-0004）。
   * 覆蓋層已經在 `/` 上了，沒有導航可言，所以原生連結語意在那裡不成立。
   */
  mode?: "page" | "overlay";
};

/**
 * - `native`：修飾鍵、中鍵、非主鍵 → 完全不攔截，交給 `<a href="/?enter=1">`。
 *   只在 `page` 模式成立：覆蓋層的出口是按鈕，Cmd／中鍵開新分頁沒有意義。
 * - `ignore`：重複觸發（雙擊、鍵盤重複）→ 吃掉，不產生第二次導航。
 * - `transition`：live 場景 → 立刻導航，同時播 ≤360ms 的淡出與相機推近。
 * - `direct`：poster／載入中／fallback／reduced motion → 立刻導航，不做任何動畫。
 */
export type EnterAction = "native" | "ignore" | "transition" | "direct";

export function resolveEnterAction(activation: EnterActivation): EnterAction {
  const { button, metaKey, ctrlKey, shiftKey, altKey } = activation;
  const modified = button !== 0 || metaKey || ctrlKey || shiftKey || altKey;
  if (modified && (activation.mode ?? "page") === "page") return "native";
  if (modified) return "ignore";
  if (activation.navigating) return "ignore";
  const live = activation.ready && activation.eligible && !activation.failed && !activation.reducedMotion;
  return live ? "transition" : "direct";
}

// 進站意圖只活在這個分頁的記憶體裡。ADR-0003 之後 Intro 不再使用 sessionStorage，
// 而 enhanced navigation 是同一個 document 的 client 轉場，所以一個模組變數就夠——
// 它也保證「直接打開 `/`」永遠不會被誤判成從 Intro 進來。
let enterIntent = false;
let entryFocusHandled = false;

export function markEnterIntent(): void {
  enterIntent = true;
}

/** 讀取並清掉意圖：一次進站只會有一次 focus 轉移。 */
export function consumeEnterIntent(): boolean {
  const intent = enterIntent;
  enterIntent = false;
  return intent;
}

export type LandingFocusDecision = {
  /** 這個分頁剛剛從 Intro 按了進入／略過。 */
  fromIntro: boolean;
  /** `location.search`；`?enter=1` 是無 JS 與深連結的語意入口。 */
  search: string;
  /** `PerformanceNavigationTiming.type`。 */
  navigationType: string;
  /** 這個 document 已經做過一次進站 focus。 */
  documentHandled: boolean;
};

/**
 * 只有「真的從 Intro 進來」才把 focus 交給 main。直接開 `/`、Back／Forward 還原
 * 都不搶焦點，否則會把使用者原本的閱讀位置與鍵盤位置弄掉。
 */
export function shouldFocusLandingMain({ fromIntro, search, navigationType, documentHandled }: LandingFocusDecision): boolean {
  if (documentHandled) return false;
  if (fromIntro) return true;
  if (navigationType === "back_forward") return false;
  return new URLSearchParams(search).get("enter") === "1";
}

export function hasHandledEntryFocus(): boolean {
  return entryFocusHandled;
}

export function markEntryFocusHandled(): void {
  entryFocusHandled = true;
}

/** 測試用：把模組層狀態歸零。 */
export function resetEnterTransitionState(): void {
  enterIntent = false;
  entryFocusHandled = false;
}
