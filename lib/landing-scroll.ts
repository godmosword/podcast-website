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

/** 把 Landing 內部 snap 容器捲到指定段。文件捲動（`window`）動不到這層。 */
export function scrollLandingToAnchor(
  anchorId: string,
  options: ScrollLandingOptions = {},
): boolean {
  const root = options.root ?? landingScrollRoot();
  const el = typeof document === "undefined" ? null : document.getElementById(anchorId);
  if (!root || !el) return false;
  const reduced =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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

/** 頂欄品牌／首頁：回到 Landing 第一屏。不在首頁時回 false，交給 `/` 導航。 */
export function scrollLandingToFirstSegment(): boolean {
  return scrollLandingToAnchor(LANDING_FIRST_ANCHOR_ID, { behavior: "auto" });
}
