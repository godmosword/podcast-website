/** 孩子看得到的句子。禁詞測試掃這一包，也掃遊戲原始碼。 */

import { EVENT_KINDS, routeEvents } from "@/lib/games/orange-express/events";
import type { RunGoal, RunProgress } from "@/lib/games/orange-express/journal";
import type {
  BrakeNotch,
  DriverId,
  LandmarkId,
  LevelId,
  PointKind,
  PowerNotch,
  RunState,
  SceneId,
  ScenicEventKind,
  StopGrade,
} from "@/lib/games/orange-express/types";

export const COPY = {
  routeName: "橘色小線",
  levels: {
    look: "慢慢看",
    drive: "自己開",
    captain: "小站長",
  },
  levelHints: {
    look: "小橘會幫忙停",
    drive: "三個站，自己停",
    captain: "停車要更準",
  },
  start: "開始開車",
  howTo: "怎麼玩",
  power: "動力",
  brake: "煞車",
  horn: "喇叭",
  openDoors: "開門",
  closeDoors: "關門",
  boarding: "等人上車",
  again: "再開一次",
  backTitle: "回標題",
  arrivedHome: "到家了",
  /** 小橘結算時只說一句；低齡規則組只用保底句。 */
  resultEarlySlow: "看到速限牌，早早就慢下來",
  resultSmooth: "輕輕停，朋友站得穩穩的",
  resultAllGreen: "三站都剛剛好",
  resultLandmark: "你跟地標打招呼了",
  resultSafe: "朋友都平安到家了",
  resultLowAge: "你把朋友載到了",
  nextStop: "下一站",
  atStation: "到站了",
  tryStopAgain: "再停一次",
  reversing: "開過頭了，小橘慢慢倒回去",
  canGoFaster: "還可以再快",
  atFlag: "到速度旗了",
  paused: "暫停了",
  resume: "繼續開",
  speedometer: "速度表",
  speedFlag: "速度旗",
  stopTarget: "停車目標",
  predicted: "會停在這裡",
  /** 路線條的讀屏名稱；後面接站名與「下一站」。 */
  routeStrip: "這趟的路",
  stopWord: "停",
  slowWord: "慢",
  fastWord: "快",
  /** 兩根桿歸零都叫「鬆」：是狀態不是命令。動力歸零車只是滑行，不能寫「停」；「不推」讀起來像「不要推」。 */
  looseWord: "鬆",
  lightWord: "輕",
  emergencyWord: "緊急",
  starHint: "停在綠色區",
  overrunHint: "不要開過頭",
  earlyDoorHint: "門亮了再按",
  /** 第一次進站示範的第一拍（進站點、車還在走）：先說要用哪一根，手放好，還不拉。 */
  coachReady: "快到了，準備拉右邊",
  /** 第二拍：現在拉就停在綠區正中間（PR-I1），「現在」放最前面；後半同停車目標條的「停在綠區」。 */
  coachBrake: "現在拉，停在綠區",
  /** 推了動力、煞車沒放、車不走：先放開煞車（看桿位，不看實際作用）。 */
  releaseBrake: "先把煞車放開",
  /** 提示「先鬆煞車」時桿頂小牌改寫目標（往下拉到「鬆」），不再亮著現在的「輕」讓人以為要停在那。 */
  releaseWord: "↓鬆",
  /** 桿子得到焦點時讀屏說明鍵位：上下永遠是動力、左右永遠是煞車。 */
  leverKeys: "上下鍵是動力，左右鍵是煞車",
  nextGame: "接著玩",
  lampFlag: "速度旗",
  lampDoor: "門",
  lampStop: "停車",
  lampOn: "燈亮了",
  lampOff: "燈沒亮",
  lampsLabel: "駕駛台的燈",
  lampLight: "車內燈",
  driverLabel: "司機",
  driverHow: "家長在遊戲設定切換",
  autoBrakeOn: "超過速度旗了，小橘幫你輕輕煞車",
  signAhead: "速限牌",
  signFast: "可以開快",
  signMid: "開中速",
  signSlow: "要慢慢開",
  tunnel: "進隧道了，車內燈亮了",
  bridge: "鐵橋！按喇叭打招呼",
  bridgeGreeted: "叭叭！跟鐵橋打招呼了",
  passing: "對向列車來了，揮揮手",
  /** 小站長第二站起關門時的紅燈：前窗右上看得到這句，朗讀併在「下一站」廣播前面說。 */
  redWait: "紅燈，等一下",
  redWaitAnnounce: "紅燈，等一下，對向列車要先過去喔",
  friendsAboard: "朋友上車了",
  point: "指差確認",
  pointDone: "確認好了",
} as const;

/** 標題難度卡圖示下面的小點：幾點就是多難。 */
export const LEVEL_DOTS: Record<LevelId, 1 | 2 | 3> = {
  look: 1,
  drive: 2,
  captain: 3,
};

export const DRIVER_NAME: Record<DriverId, string> = {
  little: "小小司機",
  big: "大司機",
};

export const DRIVER_HINT: Record<DriverId, string> = {
  little: "3–4 歲：桿子自動限速，只學開和停",
  big: "5–7 歲：停準拿星星、輕輕停、跟地標打招呼",
};

/** 停好後跟地標打招呼（大司機、小站長）：朗讀與讀屏說這句，喇叭亮黃圈。 */
export const LANDMARK_GREET: Record<LandmarkId, string> = {
  ferris: "按喇叭，跟摩天輪打招呼",
  "orange-tree": "按喇叭，跟橘子樹打招呼",
  house: "按喇叭，跟小房子打招呼",
};

/** 指差確認圓鈕下面的小標：要確認的那樣東西。整句由朗讀與讀屏說。 */
export const POINT_WHAT: Record<PointKind, string> = {
  signal: "號誌",
  sign: "速限牌",
  platform: "月台",
};

/** 指差確認時說的話。 */
export const POINT_CALL: Record<PointKind, string> = {
  signal: "號誌，綠燈！",
  sign: "速限牌，確認！",
  platform: "月台，確認！",
};

export function signWord(bars: 1 | 2 | 3): string {
  if (bars === 3) return COPY.signFast;
  if (bars === 2) return COPY.signMid;
  return COPY.signSlow;
}

/** 只數做到的，不寫「幾分之幾」：沒按不扣分，寫成 1/9 會讀成沒及格。 */
export function pointsResultText(done: number): string {
  return `${COPY.point} ${done} 次`;
}

export function bridgeResultText(count: number): string {
  return `鐵橋打招呼 ${count} 次`;
}

/** 有打才顯示，跟鐵橋那顆一樣只加不減；讀屏也讀得到地標章。 */
export function landmarkResultText(count: number): string {
  return `跟地標打招呼 ${count} 站`;
}

/** 過鐵軌的小動物：海邊是螃蟹，其他是小鴨。 */
export function crossingCritter(scene: SceneId): string {
  return scene === "sea" ? "螃蟹" : "小鴨";
}

/** 賽跑的小動物：海邊是海鷗，其他是小狗（前窗畫布與圖示同一隻）。 */
export function racer(scene: SceneId): string {
  return scene === "sea" ? "海鷗" : "小狗";
}

/** 沿途事件的提示：一個動作、一句話（前窗上緣＋朗讀）。 */
/**
 * brake：小站長（完整桿面，P1／P2 的狀態字也是「慢」，但推了不會變慢）小鴨改說「拉煞車」，
 * 不出現「慢」字，跟亮起的煞車格對得上（PR-I4 設計審）。
 */
export function eventHint(kind: ScenicEventKind, scene: SceneId, brake = false): string {
  if (kind === "ducks") return `${crossingCritter(scene)}要過鐵軌，${brake ? "拉煞車" : "慢下來"}`;
  if (kind === "crossing") return "平交道，按喇叭";
  if (kind === "wave") return "有朋友在揮手，按喇叭";
  return `跟${racer(scene)}賽跑，推到快`;
}

/**
 * 做到了：前窗上緣換成這句（不念，鈴聲和小橘的笑臉就是回饋）。
 * 賽跑推著快、還沒到終點時說「快追上了」（passed = false，還不算做到），到終點追上了才說「跑贏了」，字跟畫面一致。
 */
export function eventDoneText(kind: ScenicEventKind, scene: SceneId, passed = true): string {
  if (kind === "ducks") return `${crossingCritter(scene)}慢慢走過去了`;
  if (kind === "crossing") return "叭叭！平交道";
  if (kind === "wave") return "叭叭！朋友好開心";
  return passed ? `跑贏${racer(scene)}了` : `快追上${racer(scene)}了`;
}

/** 結算事件章的名字（讀屏）。 */
export const EVENT_NAME: Record<ScenicEventKind, string> = {
  ducks: "小動物過鐵軌",
  crossing: "平交道",
  wave: "揮手的朋友",
  race: "賽跑",
};

/** 結算說事件的那一句：這一種事件每次都做到才說。 */
export function eventResultLine(kind: ScenicEventKind, scenes: readonly SceneId[]): string {
  if (kind === "ducks") {
    const critters = new Set(scenes.map(crossingCritter));
    return `${critters.size === 1 ? [...critters][0] : "小動物"}都平安過鐵軌了`;
  }
  if (kind === "crossing") return "平交道前都有按喇叭";
  if (kind === "wave") return "跟揮手的朋友打招呼了";
  return `跑贏${racer(scenes[0] ?? "city")}了`;
}

/** 開局任務卡（大司機）：念完才收，或孩子第一次碰桿子就收。 */
export function missionLine(names: readonly string[]): string {
  return `今天要去接${names.join("、")}回家`;
}

/** 一趟有這麼多面降速牌前提前慢下來，結算就說這件事（一趟共六面降速牌）。 */
export const EARLY_SLOW_RESULT = 2;

/** 結算只挑一句正面的話；低齡不提技巧，依優先序選本趟最值得記住的事。 */
export function resultComment(
  state: Pick<RunState, "course" | "earlySlows" | "smoothStops" | "grades" | "stations" | "landmarkGreets" | "events">,
): string {
  if (state.course === "look" || state.course === "little") return COPY.resultLowAge;
  // 「看到速限牌」只對有速限牌的小站長說；大司機改說沿途事件。
  if (state.course === "captain" && state.earlySlows >= EARLY_SLOW_RESULT) return COPY.resultEarlySlow;
  const events = eventResultFor(state);
  if (events) return events;
  if (state.smoothStops >= 2) return COPY.resultSmooth;
  if (state.stations.length === 3 && state.grades.length >= 3 && state.grades.slice(0, 3).every((grade) => grade === "green")) {
    return COPY.resultAllGreen;
  }
  if (state.landmarkGreets.length > 0) return COPY.resultLandmark;
  return COPY.resultSafe;
}

/** 沿途事件優先：小動物過鐵軌＞平交道＞揮手的朋友＞賽跑，挑第一種「每次都做到」的。 */
function eventResultFor(state: Pick<RunState, "stations" | "events">): string | null {
  const all = routeEvents(state.stations);
  for (const kind of EVENT_KINDS) {
    const these = all.filter((event) => event.kind === kind);
    if (these.length === 0 || !these.every((event) => state.events[event.key] === "done")) continue;
    return eventResultLine(
      kind,
      these.map((event) => state.stations[event.stationIndex]!.scene),
    );
  }
  return null;
}

/**
 * 每站停車的等級。星星只留給整趟的獎章，這裡不說幾顆星。
 * 黃區也算停好了，所以說「停到了」，不說「差一點」。逗號讓窄前窗在 keep-all 下有地方換行。
 */
export const GRADE_TEXT: Record<StopGrade, string> = {
  green: "剛剛好，停在綠區",
  yellow: "停到了，在黃區",
};

/** 結算站卡上跟色塊並排的兩三個字。 */
export const GRADE_WORD: Record<StopGrade, string> = {
  green: "剛剛好",
  yellow: "停到了",
};

/** 低齡桿面的三格照位置寫：鬆、慢、快（慢慢看是 P0–P2，小小司機是 P0／P2／P4）。 */
const SIMPLE_POWER_WORDS = [COPY.looseWord, COPY.slowWord, COPY.fastWord] as const;

/** simple：低齡桿面這一組的格子；有給就照位置寫字。 */
export function powerWord(notch: PowerNotch, simple?: readonly PowerNotch[]): string {
  const at = simple ? simple.indexOf(notch) : -1;
  if (at >= 0) return SIMPLE_POWER_WORDS[Math.min(at, SIMPLE_POWER_WORDS.length - 1)]!;
  if (notch === 0) return COPY.looseWord;
  return notch <= 2 ? COPY.slowWord : COPY.fastWord;
}

export function brakeWord(notch: BrakeNotch): string {
  if (notch === 0) return COPY.looseWord;
  if (notch === 5) return COPY.emergencyWord;
  return notch <= 2 ? COPY.lightWord : COPY.stopWord;
}

/** 燈上的小字：P1…P4、B1…B4、緊急。低齡桿面寫字，不寫代碼。 */
export function powerLampLabel(notch: PowerNotch, simple?: readonly PowerNotch[]): string {
  if (simple) return powerWord(notch, simple);
  return `P${notch}`;
}

/** simple：低齡只有鬆、停、緊急三格，格上直接寫字，不寫 B3。 */
export function brakeLampLabel(notch: BrakeNotch, simple = false): string {
  if (notch === 5) return COPY.emergencyWord;
  if (simple) return brakeWord(notch);
  return `B${notch}`;
}

export function powerValueText(notch: PowerNotch, simple?: readonly PowerNotch[]): string {
  if (simple) return `${COPY.power}，${powerWord(notch, simple)}`;
  return `${COPY.power} ${powerLampLabel(notch)}，${powerWord(notch)}`;
}

export function brakeValueText(notch: BrakeNotch, simple = false): string {
  if (notch === 5 || simple) return `${COPY.brake}，${brakeWord(notch)}`;
  return `${COPY.brake} ${brakeLampLabel(notch)}，${brakeWord(notch)}`;
}

/** 跟上一趟比進步了：結算那句換成這句（PR-I3）。第一次做到的事件照場景換動物。 */
export function progressText(progress: RunProgress, scene: SceneId): string {
  if (progress.kind === "goal-done") return `說好的${GOAL_TEXT[progress.goal]}，做到了！`;
  if (progress.kind === "all-green") return "第一次每站都停在綠色區！";
  if (progress.kind === "more-green") return "停在綠色區的站比上次多了！";
  if (progress.kind === "more-smooth") return "輕輕停的站比上次多了！";
  if (progress.event === "ducks") return `第一次讓${crossingCritter(scene)}慢慢過鐵軌`;
  if (progress.event === "crossing") return "第一次在平交道按喇叭";
  if (progress.event === "wave") return "第一次跟揮手的朋友打招呼";
  return `第一次跑贏${racer(scene)}`;
}

/**
 * 下趟小目標（結算前面接「下次試試：」，任務卡前面接「這次試試：」）。
 * 說要做的動作、正向（設計審：「不要…」只說不能做什麼，3–4 歲聽到動作才知道怎麼做）。
 */
export const GOAL_TEXT: Record<RunGoal, string> = {
  green: "停在綠色區",
  overrun: "早一點拉停",
  "early-door": "等門亮了再按",
  smooth: "輕輕停",
  ducks: "慢下來讓小動物先過",
  crossing: "平交道前按喇叭",
  wave: "朋友揮手時按喇叭",
  race: "賽跑時推到快",
};

export const GOAL_NEXT = "下次試試：";
export const GOAL_NOW = "這次試試：";

/** 沿途見聞（標題）：讀屏說收集到哪些。 */
export const JOURNAL_LABEL = "沿途見聞";

/** 地標的名字（沿途見聞的讀屏）。 */
export const LANDMARK_NAME: Record<LandmarkId, string> = {
  ferris: "摩天輪",
  "orange-tree": "橘子樹",
  house: "小房子",
};

/** 結算那句：跟上一趟比進步了就說進步，不然照 resultComment 挑。 */
export function resultLineFor(
  run: Parameters<typeof resultComment>[0],
  progress: RunProgress | null,
): string {
  if (!progress) return resultComment(run);
  const event = progress.kind === "first-event" ? routeEvents(run.stations).find((e) => e.kind === progress.event) : undefined;
  const scene = run.stations[event?.stationIndex ?? 0]?.scene ?? "city";
  return progressText(progress, scene);
}
