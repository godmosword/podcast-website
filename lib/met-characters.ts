/**
 * 「認識過的車車」收集狀態：聽過某車種的故事就把它記進 localStorage，
 * 角色圖鑑頁據此點亮車庫。純本機、不外送。
 */

const STORAGE_KEY = "cc:met-vehicles";
export const MET_CHANGE_EVENT = "cc:met-change";

export function getMetVehicles(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

/** 記下一個認識過的車種；若是新車種則廣播，讓圖鑑頁即時點亮。 */
export function markVehicleMet(vehicle: string): void {
  if (typeof window === "undefined" || !vehicle) return;
  const current = getMetVehicles();
  if (current.includes(vehicle)) return;
  const next = [...current, vehicle];
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    return;
  }
  window.dispatchEvent(new CustomEvent(MET_CHANGE_EVENT, { detail: vehicle }));
}
