import type { LevelId } from "@/lib/games/orange-express/types";

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
