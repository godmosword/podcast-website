import { COPY, signWord } from "@/lib/games/orange-express/copy";
import { kmh } from "@/lib/games/orange-express/gauge";
import { currentStation, inTunnel, nextSign, onBridge } from "@/lib/games/orange-express/reducer";
import { signBars } from "@/lib/games/orange-express/windshield";
import type { RunState } from "@/lib/games/orange-express/types";

export type NoticeKind = "bridge" | "greeted" | "sign" | "passing" | "tunnel";

export type WindowNotice = {
  kind: NoticeKind;
  text: string;
  /** 速限牌的快慢條數，畫在提示的小圓牌上。 */
  bars?: 1 | 2 | 3;
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
    return { kind: "sign", text, bars };
  }
  if (inTunnel(state)) return { kind: "tunnel", text: COPY.tunnel };
  return null;
}
