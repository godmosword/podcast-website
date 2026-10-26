/** 小橘特快車的純資料形狀。畫面與音效不在這裡。 */

export type LevelId = "look" | "drive" | "captain";

export type Notch = 0 | 1 | 2;

export type Phase =
  | "running"
  | "in-window"
  | "stopped"
  | "doors-open"
  | "route-done";

export type PassengerId = "bonbon" | "mami" | "xiaonan" | "dot";

export type Passenger = {
  id: PassengerId;
  name: string;
};

export type StationId = "orange-park" | "orange-slope" | "orange-home";

export type Station = {
  id: StationId;
  name: string;
  window: { start: number; end: number };
  approachAt: number;
  approachLimit: number;
  passengers: readonly Passenger[];
};

export type RunState = {
  level: LevelId;
  stations: readonly Station[];
  stationIndex: number;
  phase: Phase;
  power: Notch;
  brake: Notch;
  speed: number;
  /** 這一站的 0–1。到站窗用這個判斷，不看畫面上的像素。 */
  progress: number;
  boarded: number;
  boardTimer: number;
  misses: number;
};

export type RunAction =
  | { type: "set-power"; notch: Notch }
  | { type: "set-brake"; notch: Notch }
  | { type: "tick"; dt: number }
  | { type: "open-doors" }
  | { type: "close-doors" };

/** 測試與 e2e 用。正式遊玩不會寫這個物件。 */
export type OrangeExpressHook = {
  progress?: number;
  speed?: number;
  stationIndex?: number;
  misses?: number;
};

export const LEVEL_INDEX: Record<LevelId, number> = {
  look: 0,
  drive: 1,
  captain: 2,
};

declare global {
  interface Window {
    __orangeExpress?: OrangeExpressHook;
    __orangeExpressJump?: (patch: OrangeExpressHook) => void;
  }
}
