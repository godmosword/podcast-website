/**
 * progress-store 的 localStorage key／事件名（葉模組，無任何 import）。
 * 獨立成檔是為了打破 theme.ts ↔ progress-store.ts 的循環相依：
 * theme 的 THEME_INIT_SCRIPT 在模組初始化期就要讀 key，若直接 import
 * progress-store，Firefox 的 chunk 評估順序會踩 TDZ ReferenceError（D4 驗收 #7 發現）。
 */
export const PROGRESS_STORAGE_KEY = "cheche:progress";
export const PROGRESS_CHANGE_EVENT = "cheche:progress-change";
