import { ZONE_IDS, type ZoneId, type ZoneStatus } from "@/data/universe-zones";

const VALID_STATUSES: ZoneStatus[] = ["open", "building", "coming", "planned"];

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
