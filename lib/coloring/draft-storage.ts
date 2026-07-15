/** 著色草稿 localStorage（data URL）。 */
import { coloringDraftKey } from "@/lib/coloring/tools";

function canUseStorage(): boolean {
  try {
    return typeof window !== "undefined" && typeof window.localStorage?.getItem === "function";
  } catch {
    return false;
  }
}

export function loadColoringDraft(pageId: string): string | null {
  if (!canUseStorage()) return null;
  try {
    return window.localStorage.getItem(coloringDraftKey(pageId));
  } catch {
    return null;
  }
}

export function saveColoringDraft(pageId: string, dataUrl: string): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(coloringDraftKey(pageId), dataUrl);
  } catch {
    // quota 滿則略過
  }
}

export function clearColoringDraft(pageId: string): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(coloringDraftKey(pageId));
  } catch {
    // ignore
  }
}
