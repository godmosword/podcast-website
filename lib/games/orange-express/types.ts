/** 小橘特快車的純資料形狀。畫面與音效不在這裡。 */

export type LevelId = "look" | "drive" | "captain";

/** 「自己開」再分兩種司機，家長在設定切換。 */
export type DriverId = "little" | "big";

/** 實際跑的規則組：慢慢看、小小司機、大司機、小站長。 */
export type CourseId = "look" | "little" | "big" | "captain";

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

/** 窗外背景。 */
export type SceneId = "field" | "city" | "sea";

/** 一段路（這一站的 0–1）。 */
export type Span = { from: number; to: number };

/** 路旁速限牌：過了 at 之後，速度旗變成 limit。 */
export type SpeedSign = { at: number; limit: number };

export type PointKind = "signal" | "sign" | "platform";

/** 指差確認小任務：在 at–until 之間出現，按了就算完成；錯過不扣分。 */
export type PointTask = { id: string; kind: PointKind; at: number; until: number };

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
  scene: SceneId;
  tunnel: Span | null;
  bridge: Span | null;
  /** 對向列車在這裡出發迎面擦身；null 表示這一站沒有。 */
  passAt: number | null;
  /** 有速限牌的規則組才有；沒有時只剩進站的速度旗。 */
  signs: readonly SpeedSign[];
  points: readonly PointTask[];
};

export type RunState = {
  level: LevelId;
  course: CourseId;
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
  /** 超過速度旗時，小橘自己輕輕煞車。 */
  autoBrake: boolean;
  /** 自動輕煞響過幾次。不扣分，只給測試與家長看。 */
  autoBrakeCount: number;
  /** 對向列車擦身經過了幾秒；null 表示現在沒有。 */
  passing: number | null;
  /** 這一站的對向列車已經來過。 */
  passedTrain: boolean;
  /** 這一站在鐵橋上按過喇叭。 */
  bridgeGreeted: boolean;
  bridgeGreets: number;
  /** 完成的指差確認 id。 */
  pointsDone: readonly string[];
};

export type RunAction =
  | { type: "set-power"; notch: number }
  | { type: "set-brake"; notch: number }
  | { type: "tick"; dt: number }
  | { type: "open-doors" }
  | { type: "close-doors" }
  | { type: "honk" }
  | { type: "point" };

/** 測試與 e2e 用。正式遊玩不會寫這個物件。 */
export type OrangeExpressHook = {
  progress?: number;
  speed?: number;
  stationIndex?: number;
  misses?: number;
  power?: number;
  brake?: number;
  /** 對向列車擦身的秒數。 */
  passing?: number;
  /** 讓前窗迴圈停住，截圖時畫面不會再往前跑。 */
  freeze?: boolean;
  /** 只在開局時讀：蓋過家長設定的司機。 */
  driver?: DriverId;
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
