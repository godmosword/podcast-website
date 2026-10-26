import type { DriverId, LevelId } from "@/lib/games/orange-express/types";

export function normalizeOrangeExpressLevel(value: unknown): LevelId | null {
  if (value === "look" || value === "drive" || value === "captain") return value;
  return null;
}

/** 沒存過：兒童模式預選慢慢看，關掉預選自己開。小站長不會被預選。 */
export function resolveOrangeExpressLevel(
  stored: LevelId | null,
  kidsMode: boolean,
): LevelId {
  if (stored) return stored;
  return kidsMode ? "look" : "drive";
}

export function normalizeOrangeExpressDriver(value: unknown): DriverId | null {
  if (value === "little" || value === "big") return value;
  return null;
}

/** 家長沒切過：兒童模式開著是小小司機（3–4 歲），關掉是大司機（5–7 歲）。 */
export function resolveOrangeExpressDriver(stored: DriverId | null, kidsMode: boolean): DriverId {
  if (stored) return stored;
  return kidsMode ? "little" : "big";
}
