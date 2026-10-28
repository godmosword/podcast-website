/** 孩子看得到的句子。禁詞測試掃這一包，也掃遊戲原始碼。 */

import type { BrakeNotch, DriverId, PointKind, PowerNotch, StopGrade } from "@/lib/games/orange-express/types";

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
  stopWord: "停",
  slowWord: "慢",
  fastWord: "快",
  looseWord: "鬆",
  lightWord: "輕",
  emergencyWord: "緊急",
  starHint: "停在綠色區",
  overrunHint: "不要開過頭",
  earlyDoorHint: "門亮了再按",
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
  point: "指差確認",
  pointDone: "確認好了",
} as const;

export const DRIVER_NAME: Record<DriverId, string> = {
  little: "小小司機",
  big: "大司機",
};

export const DRIVER_HINT: Record<DriverId, string> = {
  little: "3–4 歲：桿子自動限速，只學開和停",
  big: "5–7 歲：速限牌、停準拿星星、指差確認",
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

export function powerWord(notch: PowerNotch): string {
  if (notch === 0) return COPY.stopWord;
  return notch <= 2 ? COPY.slowWord : COPY.fastWord;
}

export function brakeWord(notch: BrakeNotch): string {
  if (notch === 0) return COPY.looseWord;
  if (notch === 5) return COPY.emergencyWord;
  return notch <= 2 ? COPY.lightWord : COPY.stopWord;
}

/** 燈上的小字：P1…P4、B1…B4、緊急。 */
export function powerLampLabel(notch: PowerNotch): string {
  return notch === 0 ? "P0" : `P${notch}`;
}

export function brakeLampLabel(notch: BrakeNotch): string {
  if (notch === 5) return COPY.emergencyWord;
  return `B${notch}`;
}

export function powerValueText(notch: PowerNotch): string {
  return `${COPY.power} ${powerLampLabel(notch)}，${powerWord(notch)}`;
}

export function brakeValueText(notch: BrakeNotch): string {
  if (notch === 5) return `${COPY.brake}，${COPY.emergencyWord}`;
  return `${COPY.brake} ${brakeLampLabel(notch)}，${brakeWord(notch)}`;
}
