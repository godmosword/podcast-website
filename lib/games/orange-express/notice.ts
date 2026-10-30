import { COPY, LANDMARK_GREET, POINT_CALL, signWord } from "@/lib/games/orange-express/copy";
import { kmh } from "@/lib/games/orange-express/gauge";
import {
  currentStation,
  inTunnel,
  landmarkTaskPending,
  nextSign,
  onBridge,
  pendingPoint,
} from "@/lib/games/orange-express/reducer";
import { stopBarFor } from "@/lib/games/orange-express/stop-target";
import { signBars } from "@/lib/games/orange-express/windshield";
import type { RunState } from "@/lib/games/orange-express/types";

/** door：門還沒亮就按了，只在按下後短暫出現，不念進 speechCandidates（畫面另外排）。 */
export type NoticeKind = "bridge" | "greeted" | "sign" | "passing" | "tunnel" | "door";

export type WindowNotice = {
  kind: NoticeKind;
  text: string;
  /** 速限牌的快慢格數，畫在提示的小圓牌上。 */
  bars?: 1 | 2 | 3;
  /** 速限牌在這一站的位置；同一站有好幾面牌，朗讀去重靠它分。 */
  at?: number;
};

/** 速限牌經過後，提示再留這一小段，孩子才看得到。 */
const SIGN_AFTER = 0.025;

function recentSign(state: RunState): { at: number; limit: number } | null {
  const ahead = nextSign(state);
  if (ahead) return ahead;
  let last: { at: number; limit: number } | null = null;
  for (const sign of currentStation(state).signs) {
    if (sign.at <= state.progress && state.progress - sign.at <= SIGN_AFTER) last = sign;
  }
  return last;
}

/**
 * 前窗右上一次只說一件事（速限牌立在左邊，不擋）：鐵橋（請按喇叭）＞剛打完招呼＞對向列車＞速限牌＞隧道。
 * 進站區間開始後換停車目標條佔上方；停好、開門、倒車時也不說。
 */
export function windowNotice(state: RunState, numbers: boolean): WindowNotice | null {
  if (state.phase !== "running") return null;
  if (state.progress >= currentStation(state).approachAt) return null;
  if (onBridge(state)) {
    return state.bridgeGreeted
      ? { kind: "greeted", text: COPY.bridgeGreeted }
      : { kind: "bridge", text: COPY.bridge };
  }
  if (state.passing !== null) return { kind: "passing", text: COPY.passing };
  const sign = recentSign(state);
  if (sign) {
    const bars = signBars(sign.limit);
    const text = numbers ? `${COPY.signAhead} ${kmh(sign.limit)}` : `${COPY.signAhead}：${signWord(bars)}`;
    return { kind: "sign", text, bars, at: sign.at };
  }
  if (inTunnel(state)) return { kind: "tunnel", text: COPY.tunnel };
  return null;
}

/**
 * 門還沒亮就按了的那兩秒多：前窗右上說「門亮了再按」，蓋過其他提示。
 * 進站區間有停車目標條時由目標條說（見 OrangeExpressStopBar 的 hint），這裡回到平常的提示。
 */
export function noticeWithDoorHint(state: RunState, numbers: boolean, doorHint: boolean): WindowNotice | null {
  if (doorHint && !stopBarFor(state)) return { kind: "door", text: COPY.earlyDoorHint };
  return windowNotice(state, numbers);
}

function signHasTask(state: RunState, at: number | undefined): boolean {
  if (at === undefined) return false;
  return currentStation(state).points.some((task) => task.kind === "sign" && task.at <= at && at <= task.until);
}

export type SpeechItem = {
  /** 「站號:種類:位置」。不用文字當 key：家長開關速度表數字會改字。 */
  key: string;
  text: string;
};

/**
 * 前窗這一刻可以念的句子，越前面越優先。
 * 指差確認題排第一，念要喊的那句；速限牌提示和「速限牌，確認！」是同一件事，那面牌只念題目那句。
 * 「叭叭！跟鐵橋打招呼了」不念，喇叭聲本身就是回饋。
 */
export type SpeechOptions = {
  /** 第一次進站示範那一站不出月台指差確認題，不跟停車搶注意力。 */
  skipPlatform?: boolean;
};

export function speechCandidates(state: RunState, numbers: boolean, options: SpeechOptions = {}): SpeechItem[] {
  const out: SpeechItem[] = [];
  const station = state.stationIndex;
  const task = pendingPoint(state);
  if (task && !(options.skipPlatform && task.kind === "platform")) {
    out.push({ key: `${station}:point:${task.id}`, text: POINT_CALL[task.kind] });
  }
  // 停好後跟地標打招呼（大司機、小站長）：排在指差確認後面。
  if (landmarkTaskPending(state)) {
    out.push({ key: `${station}:landmark`, text: LANDMARK_GREET[currentStation(state).landmark] });
  }
  const notice = windowNotice(state, numbers);
  if (!notice || notice.kind === "greeted") return out;
  // 這面牌有「速限牌，確認！」題的話，只念題目那句；題目還沒出、已經做完都一樣，不然同一面牌會念兩次。
  if (notice.kind === "sign" && signHasTask(state, notice.at)) return out;
  const where = notice.kind === "sign" ? `:${notice.at ?? 0}` : "";
  out.push({ key: `${station}:${notice.kind}${where}`, text: notice.text });
  return out;
}

/**
 * 該念哪一句：還沒念過的第一句。同一件事一站只念一次（A→B→A 不重念）。
 * 每次都從「這一刻」的畫面挑，提示已經消失的就自然不會念到。
 * 車內廣播還沒念完時由呼叫端先等，不在這裡排隊。
 */
export function nextSpeech(
  state: RunState,
  numbers: boolean,
  spoken: ReadonlySet<string>,
  options: SpeechOptions = {},
): SpeechItem | null {
  return speechCandidates(state, numbers, options).find((item) => !spoken.has(item.key)) ?? null;
}
