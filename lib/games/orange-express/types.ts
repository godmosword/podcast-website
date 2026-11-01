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

/** 停在哪一區：綠區「剛剛好」、黃區「停到了」。星星只算整趟，不算每站。 */
export type StopGrade = "green" | "yellow";

/** 出發號誌。紅燈時推動力車也不走。 */
export type SignalAspect = "red" | "green";

export type PassengerId = "bonbon" | "mami" | "xiaonan" | "dot";

export type Passenger = {
  id: PassengerId;
  /** 卡上印的名字；showName 為 false 時只給讀屏念。 */
  name: string;
  showName?: boolean;
};

export type StationId = "orange-park" | "orange-slope" | "orange-home";

/** 窗外背景。 */
export type SceneId = "field" | "city" | "sea";

/** 每站一個醒目地標：遊樂園摩天輪、橘子坡橘子大樹、回家紅屋頂小房子。 */
export type LandmarkId = "ferris" | "orange-tree" | "house";

/** 一段路（這一站的 0–1）。 */
export type Span = { from: number; to: number };

/** 路旁速限牌：過了 at 之後，速度旗變成 limit。 */
export type SpeedSign = { at: number; limit: number };

/** 看不到的降速區：from–to 之間速度旗不高於 limit，超過照樣自動輕煞。降速的理由由沿途事件說（PR-H3）。 */
export type SlowZone = { from: number; to: number; limit: number };

/**
 * 站前的風景段（大司機的旅程）：沒有停車窗、上車、示範，只有窗外的風景（沿途事件在 PR-H3）。
 * 長度跟站段同一個單位（一站的 0–1），1 約等於巡航 6.8 秒。
 */
export type ScenicSection = { id: string; length: number };

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
  /** 窗外的站點地標；駕駛台站名旁與結算站卡也放同一個小圖示。 */
  landmark: LandmarkId;
  tunnel: Span | null;
  bridge: Span | null;
  /** 對向列車在這裡出發迎面擦身；null 表示這一站沒有。 */
  passAt: number | null;
  /**
   * 小站長第二站起：關門時出發號誌是紅燈，對向列車一關門就從遠方開過來，車尾過去才轉綠。
   * 這一站的對向列車改由關門觸發，不看 passAt。
   */
  holdAtStart: boolean;
  /** 有速限牌的規則組才有；沒有時只剩進站的速度旗。 */
  signs: readonly SpeedSign[];
  /** 看不到的降速區（事件前）；還沒有事件時是空的。 */
  slowZones: readonly SlowZone[];
  points: readonly PointTask[];
  /** 這一站前面的風景段，依序開過才到站段；沒有旅程的規則組是空的。 */
  scenic: readonly ScenicSection[];
};

export type RunState = {
  level: LevelId;
  course: CourseId;
  stations: readonly Station[];
  stationIndex: number;
  phase: Phase;
  power: PowerNotch;
  brake: BrakeNotch;
  /** 實際的動力作用（每秒加多少速度）。桿位變了要一點時間才跟上，見 physics.ts。 */
  tractive: number;
  /** 實際的煞車作用（每秒減多少速度）。 */
  braking: number;
  /** 停住前最後一段的減速度，供平穩停車回饋判斷。 */
  stopJerk: number;
  /** 第一次停靠時平穩停下的站數。 */
  smoothStops: number;
  speed: number;
  /**
   * 這一站的 0–1。到站窗用這個判斷，不看畫面上的像素。
   * 風景段時是負的：從 -（風景段總長）開到 0 才進站段，所以站段的判定都不必知道風景段。
   */
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
  /** 出發號誌；紅燈只出現在 holdAtStart 的站，對向列車車尾過去就轉綠。 */
  signal: SignalAspect;
  /** 降速的速限牌前先放動力或拉煞車、過牌時不太快的次數（大司機、小站長）。 */
  earlySlows: number;
  /** 前面那面降速牌已經先慢下來準備好了（記牌子的位置）；過牌或換站就清掉。 */
  slowPrep: number | null;
  /** 這一站在鐵橋上按過喇叭。 */
  bridgeGreeted: boolean;
  bridgeGreets: number;
  /** 停好後按喇叭跟地標打過招呼的站（站號）。跟指差確認、鐵橋分開數。 */
  landmarkGreets: readonly number[];
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
  /** 跳到這一站第幾段風景段的起點（沒寫 progress 時才用）；站段是 scenic.length。 */
  section?: number;
  misses?: number;
  power?: number;
  brake?: number;
  /** 對向列車擦身的秒數。 */
  passing?: number;
  /** 出發號誌。跳站時沒寫就是綠燈；寫 red 會從這一站起點、對向列車剛出現開始等。 */
  signal?: SignalAspect;
  /** 讓前窗迴圈停住，截圖時畫面不會再往前跑。 */
  freeze?: boolean;
  /** 只在開局時讀：蓋過家長設定的司機。 */
  driver?: DriverId;
  /** 只在開局時讀：掛鉤在時預設不做第一次進站示範（測試與基準要穩定），寫 true 才做。 */
  coach?: boolean;
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
