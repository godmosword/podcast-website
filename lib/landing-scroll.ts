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
let landingTransitionInFlight = 0;

/** 觸控板像素累積到這個距離才換一段，避免輕掃連跳。 */
export const LANDING_WHEEL_THRESHOLD_PX = 64;
/** 滑鼠滾輪一行約略像素（`deltaMode === 1`）。 */
export const LANDING_WHEEL_LINE_PX = 16;
/** 轉場結束後還要等滾輪手勢停住，才接受下一次。 */
export const LANDING_WHEEL_IDLE_MS = 220;

/** 進行中的程式換段（圓鈕或滾輪）；滾輪在這段期間只擋原生捲、不再開下一段。 */
export function isLandingScrollTransitionPending(): boolean {
  return landingTransitionInFlight > 0;
}

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
 * 圓鈕／滑鼠滾輪／頂欄回家：淡出目前段 → `auto` 對齊 → 淡入微縮放。
 * 手指滑與方向鍵仍只靠 snap，避免和 mandatory snap 打架。
 * reduced-motion 或分頁隱藏時立刻到位。
 */
export async function transitionLandingToAnchor(
  anchorId: string,
): Promise<boolean> {
  const gen = ++landingTransitionGen;
  landingTransitionInFlight += 1;
  try {
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
  } finally {
    landingTransitionInFlight = Math.max(0, landingTransitionInFlight - 1);
  }
}

export type LandingWheelPlanInput = {
  deltaY: number;
  deltaMode: number;
  deltaX?: number;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  reducedMotion: boolean;
  locked: boolean;
  accumulatedPx: number;
  pageSizePx?: number;
};

export type LandingWheelPlan = {
  preventDefault: boolean;
  nextAccumulatedPx: number;
  direction: 1 | -1 | 0;
};

/** 把 wheel delta 收成像素，方便觸控板累積、滑鼠一格換一段。 */
export function normalizeLandingWheelDelta(
  event: { deltaY: number; deltaMode: number },
  pageSizePx = 640,
): number {
  if (event.deltaMode === 1) return event.deltaY * LANDING_WHEEL_LINE_PX;
  if (event.deltaMode === 2) return event.deltaY * pageSizePx;
  return event.deltaY;
}

export function resolveLandingWheelDirection(accumulatedPx: number): 1 | -1 | 0 {
  if (accumulatedPx >= LANDING_WHEEL_THRESHOLD_PX) return 1;
  if (accumulatedPx <= -LANDING_WHEEL_THRESHOLD_PX) return -1;
  return 0;
}

/**
 * 滾輪要不要攔截、累積多少、往哪一段。
 * 縮放修飾鍵／橫向／reduced-motion 不攔截；鎖定中只擋原生捲。
 */
export function planLandingWheelEvent(input: LandingWheelPlanInput): LandingWheelPlan {
  const deltaX = input.deltaX ?? 0;
  if (
    input.reducedMotion ||
    input.ctrlKey ||
    input.metaKey ||
    input.shiftKey ||
    Math.abs(deltaX) > Math.abs(input.deltaY)
  ) {
    return {
      preventDefault: false,
      nextAccumulatedPx: 0,
      direction: 0,
    };
  }
  if (input.locked) {
    return { preventDefault: true, nextAccumulatedPx: 0, direction: 0 };
  }
  if (input.deltaMode !== 0 && input.deltaY !== 0) {
    return {
      preventDefault: true,
      nextAccumulatedPx: 0,
      direction: input.deltaY > 0 ? 1 : -1,
    };
  }
  const next = input.accumulatedPx + normalizeLandingWheelDelta(input, input.pageSizePx);
  const direction = resolveLandingWheelDirection(next);
  return {
    preventDefault: true,
    nextAccumulatedPx: direction === 0 ? next : 0,
    direction,
  };
}

type NeighborOptions = {
  root?: HTMLElement | null;
  wrap?: boolean;
};

/** 依目前最靠近容器頂的段，找上／下一段。預設不循環。 */
export function resolveLandingNeighborAnchor(
  direction: 1 | -1,
  options: NeighborOptions = {},
): string | null {
  const root = options.root ?? landingScrollRoot();
  if (!root) return null;
  const panels = [...root.querySelectorAll<HTMLElement>("section[id^='segment-']")];
  if (panels.length === 0) return null;
  const current = landingActivePanel(root);
  if (!current) return null;
  const index = panels.indexOf(current);
  if (index < 0) return null;
  const nextIndex = index + direction;
  if (nextIndex >= 0 && nextIndex < panels.length) return panels[nextIndex]!.id;
  if (!options.wrap) return null;
  return panels[(nextIndex + panels.length) % panels.length]!.id;
}

type BindLandingWheelOptions = {
  reducedMotion?: () => boolean;
};

/**
 * 滑鼠／觸控板垂直滾輪改走 `transitionLandingToAnchor`。
 * 聽在捲動根上；手指滑仍交給 CSS snap。
 */
export function bindLandingWheel(
  root: HTMLElement,
  options: BindLandingWheelOptions = {},
): () => void {
  const reducedMotion = options.reducedMotion ?? prefersLandingReducedMotion;
  let locked = false;
  let accumulatedPx = 0;
  let idleTid = 0;

  const clearIdle = () => {
    window.clearTimeout(idleTid);
    idleTid = 0;
  };

  const scheduleUnlock = () => {
    clearIdle();
    idleTid = window.setTimeout(() => {
      locked = false;
      accumulatedPx = 0;
      idleTid = 0;
    }, LANDING_WHEEL_IDLE_MS);
  };

  const onWheel = (event: WheelEvent) => {
    const pending = isLandingScrollTransitionPending();
    if (pending) locked = true;
    const plan = planLandingWheelEvent({
      deltaY: event.deltaY,
      deltaMode: event.deltaMode,
      deltaX: event.deltaX,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey,
      reducedMotion: reducedMotion(),
      locked: locked || pending,
      accumulatedPx,
      pageSizePx: root.clientHeight || 640,
    });
    if (plan.preventDefault) event.preventDefault();
    accumulatedPx = plan.nextAccumulatedPx;

    if (plan.direction === 0) {
      if (locked && !pending) scheduleUnlock();
      return;
    }

    const anchor = resolveLandingNeighborAnchor(plan.direction, { root });
    if (!anchor) {
      accumulatedPx = 0;
      return;
    }

    locked = true;
    accumulatedPx = 0;
    void transitionLandingToAnchor(anchor).finally(() => {
      scheduleUnlock();
    });
  };

  root.addEventListener("wheel", onWheel, { passive: false });
  return () => {
    root.removeEventListener("wheel", onWheel);
    clearIdle();
  };
}

/** 測試用：把進行中的轉場世代歸零。 */
export function resetLandingScrollTransition(): void {
  landingTransitionGen = 0;
  landingTransitionInFlight = 0;
}
