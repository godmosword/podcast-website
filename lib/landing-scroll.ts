import { LANDING_SEGMENTS } from "@/data/landing-segments";

/** Landing 第一屏錨點（`data/landing-segments.ts` 第一段）。 */
export const LANDING_FIRST_ANCHOR_ID = LANDING_SEGMENTS[0].anchorId;

/** `LandingScrollView` 捲動根。頂欄不在 context 內，靠這個屬性找到容器。 */
export const LANDING_SCROLL_ROOT_ATTR = "data-landing-scroll";

function landingScrollRoot(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.querySelector<HTMLElement>(`[${LANDING_SCROLL_ROOT_ATTR}]`);
}

type ScrollLandingOptions = {
  /** 省略則用 `[data-landing-scroll]`。 */
  root?: HTMLElement | null;
  /** 省略則尊重 reduced-motion；頂欄回家必須 `auto`，否則 snap 會把 smooth 拉回當前段。 */
  behavior?: ScrollBehavior;
};

/** 程式換段：先短淡出再對齊。須與 `LandingSegment.module.css` 同步。 */
export const LANDING_SEGMENT_LEAVE_MS = 120;
/** 對齊後淡入＋微縮放。須與 `LandingSegment.module.css` 同步。 */
export const LANDING_SEGMENT_ENTER_MS = 280;

const LANDING_PHASE_ATTR = "data-landing-phase";

let landingTransitionGen = 0;

function prefersLandingReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function landingActivePanel(root: HTMLElement): HTMLElement | null {
  const panels = root.querySelectorAll<HTMLElement>("section[id^='segment-']");
  const rootTop = root.getBoundingClientRect().top;
  let best: HTMLElement | null = null;
  let bestDist = Infinity;
  for (const panel of panels) {
    const dist = Math.abs(panel.getBoundingClientRect().top - rootTop);
    if (dist < bestDist) {
      bestDist = dist;
      best = panel;
    }
  }
  return best;
}

function clearLandingPhases(root: HTMLElement) {
  for (const node of root.querySelectorAll(`[${LANDING_PHASE_ATTR}]`)) {
    node.removeAttribute(LANDING_PHASE_ATTR);
  }
}

function waitLandingMs(ms: number): Promise<void> {
  return new Promise((resolve) => {
    if (typeof document === "undefined" || document.hidden) {
      resolve();
      return;
    }
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(tid);
      document.removeEventListener("visibilitychange", onVisibility);
      resolve();
    };
    const onVisibility = () => {
      if (document.hidden) finish();
    };
    const tid = window.setTimeout(finish, ms);
    document.addEventListener("visibilitychange", onVisibility);
  });
}

/** 把 Landing 內部 snap 容器捲到指定段。文件捲動（`window`）動不到這層。 */
export function scrollLandingToAnchor(
  anchorId: string,
  options: ScrollLandingOptions = {},
): boolean {
  const root = options.root ?? landingScrollRoot();
  const el = typeof document === "undefined" ? null : document.getElementById(anchorId);
  if (!root || !el) return false;
  const reduced = prefersLandingReducedMotion();
  const targetTop =
    el.getBoundingClientRect().top -
    root.getBoundingClientRect().top +
    root.scrollTop;
  root.scrollTo({
    top: targetTop,
    behavior: options.behavior ?? (reduced ? "auto" : "smooth"),
  });
  return true;
}

/** 頂欄品牌／首頁：立刻回到 Landing 第一屏。不在首頁時回 false，交給 `/` 導航。 */
export function scrollLandingToFirstSegment(): boolean {
  return scrollLandingToAnchor(LANDING_FIRST_ANCHOR_ID, { behavior: "auto" });
}

/**
 * 圓鈕換段／頂欄回家：淡出目前段 → `auto` 對齊 → 淡入微縮放。
 * 手指滑與方向鍵仍只靠 snap，避免和 mandatory snap 打架。
 * reduced-motion 或分頁隱藏時立刻到位。
 */
export async function transitionLandingToAnchor(
  anchorId: string,
): Promise<boolean> {
  const gen = ++landingTransitionGen;
  const root = landingScrollRoot();
  const el = typeof document === "undefined" ? null : document.getElementById(anchorId);
  if (!root || !el) return false;

  if (prefersLandingReducedMotion() || document.hidden) {
    return scrollLandingToAnchor(anchorId, { behavior: "auto" });
  }

  const from = landingActivePanel(root);
  if (from === el) {
    const dist = Math.abs(
      el.getBoundingClientRect().top - root.getBoundingClientRect().top,
    );
    if (dist < 8) return true;
  }

  clearLandingPhases(root);
  if (from && from !== el) {
    from.setAttribute(LANDING_PHASE_ATTR, "leave");
    await waitLandingMs(LANDING_SEGMENT_LEAVE_MS);
    if (gen !== landingTransitionGen) return true;
    from.removeAttribute(LANDING_PHASE_ATTR);
  }

  if (document.hidden || prefersLandingReducedMotion()) {
    return scrollLandingToAnchor(anchorId, { behavior: "auto" });
  }

  if (!scrollLandingToAnchor(anchorId, { behavior: "auto" })) return false;
  el.setAttribute(LANDING_PHASE_ATTR, "enter");
  await waitLandingMs(LANDING_SEGMENT_ENTER_MS);
  if (gen !== landingTransitionGen) return true;
  el.removeAttribute(LANDING_PHASE_ATTR);
  return true;
}

/** 測試用：把進行中的轉場世代歸零。 */
export function resetLandingScrollTransition(): void {
  landingTransitionGen = 0;
}
