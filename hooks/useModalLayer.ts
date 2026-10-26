"use client";

import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

type ModalLayerOptions = {
  open: boolean;
  onClose: () => void;
  /** 開著時仍可操作的節點（面板本身、當關閉鈕用的觸發器）；其餘背景一律 inert。 */
  keepRefs: readonly RefObject<HTMLElement | null>[];
  /** 關閉後焦點還給誰。Safari 點按鈕不會給它焦點，不能靠「開啟前的 activeElement」。 */
  returnFocusRef: RefObject<HTMLElement | null>;
  /** html 之外還要鎖住的捲動容器（例如首頁自己捲動的 `[data-landing-scroll]`）。 */
  extraScrollLockSelector?: string;
};

/** 這個 hook 設的 inert 用計數記在節點上：巢狀模態共用同一個背景節點時，先關的那個不會把它解除。 */
const INERT_COUNT_ATTR = "data-modal-inert";

function holdInert(el: HTMLElement): boolean {
  const count = Number(el.getAttribute(INERT_COUNT_ATTR) ?? "0");
  // 原本就 inert、又不是模態層設的：別人的，不碰
  if (count === 0 && el.hasAttribute("inert")) return false;
  el.setAttribute(INERT_COUNT_ATTR, String(count + 1));
  el.setAttribute("inert", "");
  return true;
}

function releaseInert(el: HTMLElement) {
  const count = Number(el.getAttribute(INERT_COUNT_ATTR) ?? "0") - 1;
  if (count > 0) {
    el.setAttribute(INERT_COUNT_ATTR, String(count));
    return;
  }
  el.removeAttribute(INERT_COUNT_ATTR);
  el.removeAttribute("inert");
}

/**
 * 從每個要保留的節點往上走到 body，把沿路每一層「不含保留節點」的兄弟都設 inert。
 * 面板可以留在原本的 DOM 位置（例如頂欄抽屜要留在膠囊裡才錨得住），不必 portal 到 body。
 * 回傳這次設的節點，關閉時只釋放這些。
 */
function inertOutside(keeps: readonly HTMLElement[]): HTMLElement[] {
  const inerted: HTMLElement[] = [];
  const holdsKeep = (el: Element) => keeps.some((keep) => el === keep || el.contains(keep));
  const visited = new Set<Element>();
  for (const keep of keeps) {
    let node: Element = keep;
    while (node !== document.body && node.parentElement) {
      const parent = node.parentElement;
      if (!visited.has(parent)) {
        visited.add(parent);
        for (const sibling of Array.from(parent.children)) {
          if (!(sibling instanceof HTMLElement) || holdsKeep(sibling)) continue;
          if (holdInert(sibling)) inerted.push(sibling);
        }
      }
      node = parent;
    }
  }
  return inerted;
}

/**
 * 完整模態層（全站選單抽屜、親子地圖選縣市面板共用）：
 * - 背景不能操作、讀屏讀不到：保留節點以外都設 inert（見 inertOutside）。
 * - 捲動鎖：**只在 html** 設 `overflow: hidden`（會傳到 viewport，保留捲動位置，sticky 照常），
 *   外加呼叫端指定的捲動容器。刻意不用 `position: fixed` 位移，也不碰 body 的 overflow：
 *   前者讓 viewport 不再捲動、後者讓 body 變成自己的捲動容器——兩者都會讓已黏住的條列「脫黏」。
 * - Esc 關閉。
 * - 關閉後焦點明確還給 returnFocusRef；用 layout effect，在面板移除的同一個 commit 就交出焦點。
 *   搭配 useFocusTrap 時要傳 `returnFocus: false`，否則它會先把焦點丟回別處。
 *
 * Tab 環繞交給 useFocusTrap；這裡只補它沒做的部分。
 */
export function useModalLayer({
  open,
  onClose,
  keepRefs,
  returnFocusRef,
  extraScrollLockSelector,
}: ModalLayerOptions) {
  const onCloseRef = useRef(onClose);
  const keepRefsRef = useRef(keepRefs);
  useIsomorphicLayoutEffect(() => {
    onCloseRef.current = onClose;
    keepRefsRef.current = keepRefs;
  });

  useIsomorphicLayoutEffect(() => {
    if (!open) return;
    const keeps = keepRefsRef.current
      .map((ref) => ref.current)
      .filter((el): el is HTMLElement => el !== null);
    if (keeps.length === 0) return;

    const inerted = inertOutside(keeps);

    const scrollers = [
      document.documentElement,
      ...(extraScrollLockSelector
        ? Array.from(document.querySelectorAll<HTMLElement>(extraScrollLockSelector))
        : []),
    ];
    const previousOverflow = scrollers.map((el) => el.style.overflow);
    for (const el of scrollers) el.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onCloseRef.current();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      for (const node of inerted) releaseInert(node);
      scrollers.forEach((el, i) => {
        el.style.overflow = previousOverflow[i] ?? "";
      });
    };
  }, [open, extraScrollLockSelector]);

  const wasOpenRef = useRef(open);
  useIsomorphicLayoutEffect(() => {
    const justClosed = wasOpenRef.current && !open;
    wasOpenRef.current = open;
    if (!justClosed) return;
    const target = returnFocusRef.current;
    if (target && target.isConnected) target.focus({ preventScroll: true });
  }, [open, returnFocusRef]);
}
