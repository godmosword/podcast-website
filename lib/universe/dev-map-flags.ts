import { ZONE_IDS, type ZoneId, type ZoneStatus } from "@/data/universe-zones";

const VALID_STATUSES: ZoneStatus[] = ["open", "building", "coming", "planned"];

/**
 * 直式版面回滾閥（美術審 H3）：false 時 `layoutForViewport` 恆回橫式，
 * 直式座標／舞台資料保留無害。翻旗標即回滾，不需 revert 資料。
 */
export const MAP_PORTRAIT_LAYOUT_ENABLED = true;

/** 解析 ?devStatus=car-park:building（僅非 production） */
export function parseDevStatusOverrides(
  search: string,
): Partial<Record<ZoneId, ZoneStatus>> {
  if (process.env.NODE_ENV === "production") return {};

  const raw = new URLSearchParams(search).get("devStatus");
  if (!raw) return {};

  const [id, status] = raw.split(":");
  if (!id || !status) return {};
  if (!ZONE_IDS.includes(id as ZoneId)) return {};
  if (!VALID_STATUSES.includes(status as ZoneStatus)) return {};

  return { [id as ZoneId]: status as ZoneStatus };
}
