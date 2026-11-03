import { COPY } from "@/lib/games/orange-express/copy";
import type { LandmarkId, PassengerId, RunState, StationId } from "@/lib/games/orange-express/types";

/** 每位朋友的代表色：座位縮成小圓點時填這個色，前窗月台上等車的小人也穿這個色。 */
export const SEAT_COLOR: Record<PassengerId, string> = {
  bonbon: "rgb(140, 96, 64)",
  mami: "rgb(255, 150, 80)",
  xiaonan: "rgb(90, 160, 210)",
  dot: "rgb(190, 160, 230)",
  sprout: "rgb(120, 190, 100)",
};

export type Seat = { id: PassengerId; name: string; aboard: boolean };

export type SeatGroup = {
  id: StationId;
  name: string;
  landmark: LandmarkId;
  /** 現在要開去（或正停在）的那一站。 */
  next: boolean;
  seats: readonly Seat[];
};

export type Seats = {
  groups: readonly SeatGroup[];
  aboard: number;
  total: number;
};

/** 這一站上車了幾位：開過的站全上了，正在開門的站看 boarded，到家時全上了。 */
export function boardedAt(state: RunState, index: number): number {
  const station = state.stations[index]!;
  if (index < state.stationIndex) return station.passengers.length;
  if (index === state.stationIndex && state.phase === "doors-open") return state.boarded;
  if (index === state.stationIndex && state.phase === "route-done") return station.passengers.length;
  return 0;
}

/**
 * 駕駛台常駐的「接朋友」座位（PR-J2）：每站一組，地標章＋這站要接的朋友。
 * 沒上車是空位、上車那一刻（跟月台上車同一拍）亮起來；全接到、回到家才算完成。
 */
export function seatsFor(state: RunState): Seats {
  const done = state.phase === "route-done";
  const groups = state.stations.map((station, index) => {
    const on = boardedAt(state, index);
    return {
      id: station.id,
      name: station.name,
      landmark: station.landmark,
      next: !done && index === state.stationIndex,
      seats: station.passengers.map((rider, k) => ({ id: rider.id, name: rider.name, aboard: k < on })),
    };
  });
  const all = groups.flatMap((group) => group.seats);
  return { groups, aboard: all.filter((seat) => seat.aboard).length, total: all.length };
}

/** 讀屏：「要接的朋友：已上車 1 位，共 3 位，下一站橘子坡」（駕駛台不再另寫站名）。 */
export function seatsLabel(seats: Seats, atStation: boolean): string {
  const head = `${COPY.seatsLabel}：已上車 ${seats.aboard} 位，共 ${seats.total} 位`;
  const next = seats.groups.find((group) => group.next);
  if (!next) return head;
  return `${head}，${atStation ? COPY.atStation : COPY.nextStop}${next.name}`;
}
