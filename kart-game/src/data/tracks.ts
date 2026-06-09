export type TrackDef = {
  id: string;
  name: string;
  /** 中心線控制點 [x, z]（P2 完整 spline；P0 用平面練習場）。 */
  points: [number, number][];
  width: number;
  laps: number;
  theme: string;
  startLine: [number, number];
  medals: { gold: number; silver: number };
};

export const PRACTICE_OVAL: TrackDef = {
  id: "practice-oval",
  name: "練習橢圓道",
  points: [
    [-40, -30],
    [40, -30],
    [55, 0],
    [40, 30],
    [-40, 30],
    [-55, 0],
  ],
  width: 22,
  laps: 3,
  theme: "grass-sky",
  startLine: [0, -30],
  medals: { gold: 42000, silver: 52000 },
};

export const TRACKS = [PRACTICE_OVAL];

export function getTrack(id: string): TrackDef {
  return TRACKS.find((t) => t.id === id) ?? PRACTICE_OVAL;
}
