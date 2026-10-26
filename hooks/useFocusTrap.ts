import { useEffect, useRef, type RefObject } from "react";

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
  /**
   * 容器外、但也要算進 Tab 環繞的元素（例如開著時兼當關閉鈕的觸發器）。
   * 依 DOM 順序和容器裡的可聚焦元素排在一起；初始焦點仍只看容器。
   */
  include?: readonly RefObject<HTMLElement | null>[];
};

/**
 * 當 active 時，把鍵盤焦點移入 container 並以 Tab 環繞其中（Tab／Shift+Tab 一律由這裡決定下一個）；
 * 關閉（active 轉 false 或卸載）時把焦點還給開啟前的元素。
 * Escape 仍由呼叫端各自處理（多數選單已有自己的關閉邏輯）。
 */
export function useFocusTrap(
  active: boolean,
  containerRef: RefObject<HTMLElement | null>,
  { initialFocus = "first", returnFocus = true, include }: FocusTrapOptions = {},
) {
  const includeRef = useRef(include);
  useEffect(() => {
    includeRef.current = include;
  });

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    // 看得到、也沒被藏起來（aria-hidden、inert、visibility: hidden）才算 Tab 得到
    const visible = (el: HTMLElement) =>
      (el.offsetParent !== null || el === document.activeElement) &&
      !el.closest('[aria-hidden="true"], [inert]') &&
      getComputedStyle(el).visibility !== "hidden";
    const inContainer = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(visible);
    const extras = () =>
      (includeRef.current ?? [])
        .map((ref) => ref.current)
        .filter((el): el is HTMLElement => el !== null && !container.contains(el) && visible(el));
    const focusables = () =>
      [...extras(), ...inContainer()].sort((a, b) =>
        a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
      );
    const insideTrap = (el: Element | null) =>
      el !== null && (container.contains(el) || extras().includes(el as HTMLElement));

    if (initialFocus === "container") {
      container.focus();
    } else if (initialFocus === "first") {
      inContainer()[0]?.focus();
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      if (!container) return;
      const items = focusables();
      if (items.length === 0) return;
      // 一律自己算下一個：Safari 預設 Tab 不停在連結上，交給瀏覽器的話焦點會從中間掉到 body。
      e.preventDefault();
      const activeEl = document.activeElement;
      const index = insideTrap(activeEl) ? items.indexOf(activeEl as HTMLElement) : -1;
      const next =
        index === -1
          ? e.shiftKey
            ? items[items.length - 1]
            : items[0]
          : items[(index + (e.shiftKey ? -1 : 1) + items.length) % items.length];
      next?.focus();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (returnFocus) previouslyFocused?.focus?.();
    };
  }, [active, containerRef, initialFocus, returnFocus]);
}
