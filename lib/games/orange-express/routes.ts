import type { LevelId, Passenger, Station } from "@/lib/games/orange-express/types";

const BONBON: Passenger = { id: "bonbon", name: "Bonbon" };
const MAMI: Passenger = { id: "mami", name: "馬米" };
const XIAONAN: Passenger = { id: "xiaonan", name: "小南" };
const DOT: Passenger = { id: "dot", name: "色塊" };

type WindowSpec = Pick<Station, "window" | "target" | "greenHalf" | "approachAt" | "approachLimit">;

/** 三檔只改窗寬、綠區寬、進站點與進站速度旗。目標點都在 0.65。 */
const WINDOWS: Record<LevelId, WindowSpec> = {
  look: {
    window: { start: 0.36, end: 0.92 },
    target: 0.65,
    greenHalf: 0.1,
    approachAt: 0.22,
    approachLimit: 0.5,
  },
  drive: {
    window: { start: 0.5, end: 0.8 },
    target: 0.65,
    greenHalf: 0.05,
    approachAt: 0.34,
    approachLimit: 0.4,
  },
  captain: {
    window: { start: 0.58, end: 0.72 },
    target: 0.65,
    greenHalf: 0.025,
    approachAt: 0.4,
    approachLimit: 0.35,
  },
};

function station(
  level: LevelId,
  id: Station["id"],
  name: string,
  passengers: readonly Passenger[],
): Station {
  return { id, name, passengers, ...WINDOWS[level] };
}

/** 橘色小線。站名都是虛構的，不借用真實路線。 */
export function stationsFor(level: LevelId): readonly Station[] {
  if (level === "look") {
    return [station(level, "orange-home", "回家", [MAMI, BONBON])];
  }
  const park = station(
    level,
    "orange-park",
    "遊樂園",
    level === "captain" ? [BONBON, MAMI] : [BONBON],
  );
  const slope = station(
    level,
    "orange-slope",
    "橘子坡",
    level === "captain" ? [XIAONAN, DOT] : [XIAONAN],
  );
  const home = station(
    level,
    "orange-home",
    "回家",
    level === "captain" ? [MAMI, BONBON] : [MAMI],
  );
  return [park, slope, home];
}

export function stopEpsilon(level: LevelId): number {
  if (level === "look") return 0.08;
  if (level === "captain") return 0.04;
  return 0.06;
}
