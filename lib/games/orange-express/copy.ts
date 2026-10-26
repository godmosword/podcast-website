/** 孩子看得到的句子。禁詞測試掃這一包，也掃遊戲原始碼。 */

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
  canGoFaster: "還可以再快",
  atFlag: "到速度旗了",
  paused: "暫停了",
  resume: "繼續開",
  speedFlag: "速度旗",
  stopWord: "停",
  slowWord: "慢",
  fastWord: "快",
  looseWord: "鬆",
  starHint: "停好再開",
  nextGame: "接著玩",
} as const;

export const POWER_WORD = [COPY.stopWord, COPY.slowWord, COPY.fastWord] as const;

export function powerValueText(notch: 0 | 1 | 2): string {
  return `${COPY.power}，${POWER_WORD[notch]}`;
}

export function brakeValueText(notch: 0 | 1 | 2): string {
  const word = notch === 0 ? COPY.looseWord : POWER_WORD[notch];
  return `${COPY.brake}，${word}`;
}
