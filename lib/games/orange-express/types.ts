/** 小橘特快車的純資料形狀。畫面與音效不在這裡。 */

export type LevelId = "look" | "drive" | "captain";

/** 動力 P0–P4。 */
export type PowerNotch = 0 | 1 | 2 | 3 | 4;

/** 煞車 B0–B4，5 是緊急。 */
export type BrakeNotch = 0 | 1 | 2 | 3 | 4 | 5;

export const POWER_MAX = 4 as const;
export const BRAKE_MAX = 5 as const;
export const EMERGENCY = 5 as const;

export type Phase =
  | "running"
  | "in-window"
  | "stopped"
  | "doors-open"
  | "reversing"
  | "route-done";

/** 停在哪一區：綠區三顆星、黃區兩顆星。 */
export type StopGrade = "green" | "yellow";

export type PassengerId = "bonbon" | "mami" | "xiaonan" | "dot";

export type Passenger = {
  id: PassengerId;
  name: string;
};

export type StationId = "orange-park" | "orange-slope" | "orange-home";

export type Station = {
  id: StationId;
  name: string;
  /** 黃區的頭尾。窗外停住不算到站；超過 end 就要倒車再試。 */
  window: { start: number; end: number };
  /** 停車目標的中心。 */
  target: number;
  /** 綠區是 target ± greenHalf。 */
  greenHalf: number;
  approachAt: number;
  approachLimit: number;
  passengers: readonly Passenger[];
};

export type RunState = {
  level: LevelId;
  stations: readonly Station[];
  stationIndex: number;
  phase: Phase;
  power: PowerNotch;
  brake: BrakeNotch;
  speed: number;
  /** 這一站的 0–1。到站窗用這個判斷，不看畫面上的像素。 */
  progress: number;
  boarded: number;
  boardTimer: number;
  misses: number;
  /** 每一站第一次停好時的區。重停不覆寫。 */
  grades: readonly StopGrade[];
};

export type RunAction =
  | { type: "set-power"; notch: number }
  | { type: "set-brake"; notch: number }
  | { type: "tick"; dt: number }
  | { type: "open-doors" }
  | { type: "close-doors" };

/** 測試與 e2e 用。正式遊玩不會寫這個物件。 */
export type OrangeExpressHook = {
  progress?: number;
  speed?: number;
  stationIndex?: number;
  misses?: number;
  power?: number;
  brake?: number;
  /** 讓前窗迴圈停住，截圖時畫面不會再往前跑。 */
  freeze?: boolean;
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
