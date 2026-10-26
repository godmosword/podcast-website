/** 孩子看得到的句子。禁詞測試掃這一包，也掃遊戲原始碼。 */

import type { BrakeNotch, PowerNotch, StopGrade } from "@/lib/games/orange-express/types";

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
  nextGame: "接著玩",
  lampFlag: "速度旗",
  lampDoor: "門",
  lampStop: "停車",
  lampOn: "燈亮了",
  lampOff: "燈沒亮",
  lampsLabel: "駕駛台的燈",
} as const;

export const GRADE_TEXT: Record<StopGrade, string> = {
  green: "停在綠區，三顆星",
  yellow: "停在黃區，兩顆星",
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
