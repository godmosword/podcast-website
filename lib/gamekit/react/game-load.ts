/** 遊戲資源載入階段（preload → loading → ready / error）。 */
export type GameLoadPhase =
  | "idle"
  | "loading"
  | "ready"
  | "timeout"
  | "error";

export const DEFAULT_GAME_LOAD_TIMEOUT_MS = 30_000;

/** 讀取 Godot Web export 內建 #status-progress（需同源 iframe）。 */
export function readGodotLoaderProgress(
  doc: Document | null | undefined,
): number | null {
  if (!doc) return null;
  const el = doc.getElementById("status-progress");
  if (!el || !("value" in el) || !("max" in el)) return null;
  const value = Number(el.value);
  const max = Number(el.max);
  if (Number.isFinite(max) && max > 0 && Number.isFinite(value) && value >= 0) {
    return Math.min(100, Math.round((value / max) * 100));
  }
  return null;
}

/** Godot 載入失敗時 #status-notice 會顯示錯誤文案。 */
export function readGodotLoaderError(
  doc: Document | null | undefined,
): string | null {
  if (!doc) return null;
  const notice = doc.getElementById("status-notice");
  if (!notice || notice.style.display === "none") return null;
  const text = notice.textContent?.trim();
  return text ? text : null;
}
