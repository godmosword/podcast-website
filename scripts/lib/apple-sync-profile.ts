import type { Story } from "../../data/stories";

/** 與官網目前 Apple 新集上架框架一致（單圖 MVP + 首頁/內頁 UI 慣例）。 */
export const APPLE_SYNC_PAGE_COUNT = 1;

/** 標題關鍵字 → 車種（無 overrides 時使用，避免新集一律變「其他」）。 */
const VEHICLE_FROM_TITLE: [RegExp, string][] = [
  [/救護車/, "救護車"],
  [/挖土機/, "挖土機"],
  [/清潔車/, "清潔車"],
  [/賽車/, "賽車"],
  [/無人機/, "無人機"],
  [/電動車/, "電動車"],
  [/高鐵/, "高鐵"],
];

const VEHICLE_EMOJI: Record<string, string> = {
  救護車: "🚑",
  挖土機: "🚜",
  清潔車: "🚛",
  賽車: "🏎️",
  無人機: "🛸",
  電動車: "🔋",
  高鐵: "🚄",
  其他: "🚗",
};

function inferVehicleFromTitle(title: string): string | null {
  for (const [pattern, vehicle] of VEHICLE_FROM_TITLE) {
    if (pattern.test(title)) return vehicle;
  }
  return null;
}

function emojiForVehicle(vehicle: string): string {
  return VEHICLE_EMOJI[vehicle] ?? VEHICLE_EMOJI["其他"];
}

/** 依標題推斷車種（僅在仍為預設「其他」且無 slug override 的 vehicle 時）。 */
export function applyVehicleInference(
  story: Story,
  title: string,
  defaultVehicle: string,
  hasVehicleOverride: boolean,
): Story {
  if (hasVehicleOverride || story.vehicle !== defaultVehicle) {
    return story;
  }
  const inferred = inferVehicleFromTitle(title);
  if (!inferred) return story;
  return {
    ...story,
    vehicle: inferred,
    emoji: emojiForVehicle(inferred),
  };
}
