"use client";

import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * 選縣市面板（dialog）的模態行為：
 * - 背景不能操作：body 底下除了 dialog 以外的節點都設 `inert`（含導覽列）；
 *   原本就 inert 的節點不碰，關閉時也不會被解除。
 * - 捲動鎖：**只在 html** 設 `overflow: hidden`（會傳到 viewport，保留捲動位置，sticky 照常）。
 *   刻意不用 `position: fixed` 位移，也不碰 body 的 overflow：前者讓 viewport 不再捲動、
 *   後者讓 body 變成自己的捲動容器——兩者都會讓已黏住的位置列「脫黏」跳回原位，
 *   ≥980 面板就錨到畫面外。面板本身 `overscroll-behavior: contain`。
 * - Esc 關閉。
 * - 關閉後焦點明確還給觸發鈕（Safari 點按鈕不會給它焦點，不能靠「開啟前的 activeElement」）。
 *   用 layout effect，在 dialog 移除的同一個 commit 就交出焦點；useFocusTrap 要傳
 *   `returnFocus: false`，否則它會先把焦點丟回 body。
 *
 * Tab 環繞交給 useFocusTrap；這裡只補它沒做的部分。
 */
export function usePlayMapModal({
  open,
  onClose,
  rootRef,
  returnFocusRef,
}: {
  open: boolean;
  onClose: () => void;
  rootRef: RefObject<HTMLElement | null>;
  returnFocusRef: RefObject<HTMLElement | null>;
}) {
  const onCloseRef = useRef(onClose);
  useIsomorphicLayoutEffect(() => {
    onCloseRef.current = onClose;
  });

  useIsomorphicLayoutEffect(() => {
    if (!open) return;
    const root = rootRef.current;
    if (!root) return;

    const inerted = Array.from(document.body.children).filter(
      (node): node is HTMLElement =>
        node instanceof HTMLElement && node !== root && !node.hasAttribute("inert"),
    );
    for (const node of inerted) node.setAttribute("inert", "");

    const { documentElement } = document;
    const previousOverflow = documentElement.style.overflow;
    documentElement.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onCloseRef.current();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      for (const node of inerted) node.removeAttribute("inert");
      documentElement.style.overflow = previousOverflow;
    };
  }, [open, rootRef]);

  const wasOpenRef = useRef(open);
  useIsomorphicLayoutEffect(() => {
    const justClosed = wasOpenRef.current && !open;
    wasOpenRef.current = open;
    if (!justClosed) return;
    const target = returnFocusRef.current;
    if (target && target.isConnected) target.focus({ preventScroll: true });
  }, [open, returnFocusRef]);
}
