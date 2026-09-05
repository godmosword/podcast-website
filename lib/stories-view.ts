/** `/stories` 桌機列表顯示：縮圖（預設）／完整。旗標掛在 `<html>`，樣式不吃 React state。 */

export const STORIES_VIEW_STORAGE_KEY = "cheche:stories-view";
export const STORIES_VIEW_ATTRIBUTE = "data-stories-view";
export const STORIES_VIEW_LIST = "list";

export type StoriesView = "grid" | "list";

export const STORIES_VIEW_GRID_LABEL = "縮圖";
export const STORIES_VIEW_LIST_LABEL = "完整";
export const STORIES_VIEW_TOGGLE_LABEL = "故事列表顯示方式";

/** 手機維持現況 sizes；桌機縮圖抓 400px，避免 sizes 含 vw 讓 srcset 衝到 3840。 */
export const STORIES_CATALOG_COVER_SIZES =
  "(max-width: 480px) 80px, (max-width: 767px) 96px, 400px";

/**
 * 在 paint 前還原「完整」模式，避免先閃縮圖。
 * 只認 list；其他值（含舊資料）當縮圖預設。
 */
export const STORIES_VIEW_INIT_SCRIPT = `try{var v=localStorage.getItem("${STORIES_VIEW_STORAGE_KEY}");if(v==="${STORIES_VIEW_LIST}")document.documentElement.setAttribute("${STORIES_VIEW_ATTRIBUTE}","${STORIES_VIEW_LIST}")}catch(e){}`;

export function isStoriesView(value: string | null | undefined): value is StoriesView {
  return value === "grid" || value === "list";
}

export function applyStoriesView(view: StoriesView): void {
  if (typeof document === "undefined") return;

  if (view === "list") {
    document.documentElement.setAttribute(STORIES_VIEW_ATTRIBUTE, STORIES_VIEW_LIST);
  } else {
    document.documentElement.removeAttribute(STORIES_VIEW_ATTRIBUTE);
  }

  try {
    localStorage.setItem(STORIES_VIEW_STORAGE_KEY, view);
  } catch {
    // 隱私模式寫不進去時，至少當次瀏覽的 html 旗標已更新。
  }
}

export function readStoriesViewFromDocument(): StoriesView {
  if (typeof document === "undefined") return "grid";
  return document.documentElement.getAttribute(STORIES_VIEW_ATTRIBUTE) ===
    STORIES_VIEW_LIST
    ? "list"
    : "grid";
}
