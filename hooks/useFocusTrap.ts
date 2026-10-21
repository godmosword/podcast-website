import { useEffect, type RefObject } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

type FocusTrapOptions = {
  /**
   * 初始焦點落點："first"（預設）聚焦第一個可聚焦元素；
   * "container" 聚焦容器本身（容器需自帶 tabIndex={-1}）；
   * "none" 不移焦點，只做 Tab 環繞，讓呼叫端等排版完再移一次。
   */
  initialFocus?: "container" | "first" | "none";
  /**
   * 關閉時是否把焦點還給開啟前的元素（預設 true）。
   * 呼叫端自己有明確的返還目標時傳 false（例如 Safari 點按鈕不會給它焦點，
   * 「開啟前的 activeElement」可能只是 body）。
   */
  returnFocus?: boolean;
};

/**
 * 當 active 時，把鍵盤焦點移入 container 並以 Tab 環繞其中；
 * 關閉（active 轉 false 或卸載）時把焦點還給開啟前的元素。
 * Escape 仍由呼叫端各自處理（多數選單已有自己的關閉邏輯）。
 */
export function useFocusTrap(
  active: boolean,
  containerRef: RefObject<HTMLElement | null>,
  { initialFocus = "first", returnFocus = true }: FocusTrapOptions = {},
) {
  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusables = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

    if (initialFocus === "container") {
      container.focus();
    } else if (initialFocus === "first") {
      focusables()[0]?.focus();
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      if (!container) return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const activeEl = document.activeElement;

      if (e.shiftKey) {
        if (activeEl === first || !container.contains(activeEl)) {
          e.preventDefault();
          last.focus();
        }
      } else if (activeEl === last || !container.contains(activeEl)) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (returnFocus) previouslyFocused?.focus?.();
    };
  }, [active, containerRef, initialFocus, returnFocus]);
}
