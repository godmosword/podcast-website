import type { CoachBeat } from "@/lib/games/orange-express/coach";
import { activeEvent, eventCue, eventPending } from "@/lib/games/orange-express/events";
import {
  bridgeGreetPending,
  brakeNotches,
  currentStation,
  landmarkTaskPending,
  pendingPoint,
  powerNotches,
  signalRed,
  simpleLevers,
} from "@/lib/games/orange-express/reducer";
import { stopBarFor } from "@/lib/games/orange-express/stop-target";
import type { RunState } from "@/lib/games/orange-express/types";

/** 「停」那一格（圖示桿面的中間那格；小站長示範時亮 B3）。 */
const STOP_NOTCH = 3;
/** 小站長讓小鴨過時亮的煞車格（PR-I4）。 */
const DUCK_BRAKE = 2;

export type NextControl = "power" | "brake" | "horn" | "door" | "point" | "wave";

export type NextReason =
  | "greet"
  | "close"
  | "point"
  | "open"
  | "start"
  | "release"
  | "brake"
  | "brake-ready"
  | "event"
  | "after-ducks"
  | "bridge";

/**
 * 現在只該亮的那一個控制（PR-J1）。notch：真正的格號；null 是整根桿（或按鈕）。
 * dir：桿子要往哪推（兩根桿都是格子越大越在上面）；按鈕是 null。
 */
export type NextAction = {
  control: NextControl;
  notch: number | null;
  dir: "up" | "down" | null;
  reason: NextReason;
};

/** 這幾樣在 View，不在 RunState 裡。 */
export type NextContext = {
  /** 開局任務卡還在（一碰桿子就收）。 */
  mission: boolean;
  /** 推了動力、煞車沒放、車不走，已經過了提示的延遲。 */
  releaseHint: boolean;
  /** 這一趟有第一次進站示範。 */
  coachOn: boolean;
  /** 示範的拍子（不管這一趟有沒有示範都照算：低齡與大司機停車時機用它）。 */
  beat: CoachBeat;
};

const STILL = 0.001;

function button(control: "horn" | "door" | "point" | "wave", reason: NextReason): NextAction {
  return { control, notch: null, dir: null, reason };
}

/** 桿子要推到 notch（已經在那一格回 null）；方向看格子在桿上的位置。 */
function lever(
  control: "power" | "brake",
  notches: readonly number[],
  current: number,
  notch: number | null,
  reason: NextReason,
  dir: "up" | "down" = "up",
): NextAction | null {
  if (notch === null) return { control, notch: null, dir, reason };
  if (notch === current) return null;
  return { control, notch, dir: notches.indexOf(notch) > notches.indexOf(current) ? "up" : "down", reason };
}

/** 開門中：先跟地標打招呼，再等朋友上車，都上車了才關門。 */
function atDoors(state: RunState): NextAction | null {
  if (landmarkTaskPending(state)) return button("horn", "greet");
  if (state.boarded < currentStation(state).passengers.length) return null;
  return button("door", "close");
}

/** 出發要推的那一格：圖示桿面亮「慢」（點得到、看得懂）；小站長五格桿亮整根，推幾格留給孩子。 */
function goNotch(state: RunState): number | null {
  return simpleLevers(state.course) ? powerNotches(state.course)[1]! : null;
}

/** 車停在軌道上（出站、停太早、倒車退好）：先推動力，推了煞車沒放就亮「鬆」。 */
function standing(state: RunState, ctx: NextContext): NextAction | null {
  const powers = powerNotches(state.course);
  if (state.power === 0) {
    const race = eventPending(state)?.kind === "race";
    return lever("power", powers, state.power, race ? powers[powers.length - 1]! : goNotch(state), "start");
  }
  if (ctx.releaseHint) return lever("brake", brakeNotches(state.course), state.brake, 0, "release");
  return null;
}

/**
 * 進站：低齡與大司機在「現在拉就停進綠區」那一刻亮「停」；已經拉「輕」而且會停在綠區就不亮（不教掉輕輕停）。
 * 小站長只提醒要煞車（整根桿），什麼時候拉、拉幾格留給孩子；示範那幾趟照大司機的時機亮 B3。
 * 慢慢看由小橘自己幫忙停，不亮。
 */
function approaching(state: RunState, ctx: NextContext): NextAction | null {
  if (state.course === "look") return null;
  const brakes = brakeNotches(state.course);
  if (state.course === "captain" && !ctx.coachOn) {
    return state.brake === 0 ? lever("brake", brakes, state.brake, null, "brake-ready") : null;
  }
  if (ctx.beat !== "brake" || state.brake >= STOP_NOTCH) return null;
  if (state.brake > 0 && stopBarFor(state)?.predictedGrade === "green") return null;
  return lever("brake", brakes, state.brake, STOP_NOTCH, "brake");
}

/** 沿途事件要用的那一格（已經在那一格、或已經更慢就不亮）。 */
function forEvent(state: RunState): NextAction | null {
  const cue = eventCue(state);
  if (!cue) return null;
  if (cue === "horn") return button("horn", "event");
  if (cue === "wave") return button("wave", "event");
  const powers = powerNotches(state.course);
  if (cue === "fast") {
    const top = powers[powers.length - 1]!;
    return state.power < top ? lever("power", powers, state.power, top, "event") : null;
  }
  if (!simpleLevers(state.course)) {
    const brakes = brakeNotches(state.course);
    return state.brake < DUCK_BRAKE ? lever("brake", brakes, state.brake, DUCK_BRAKE, "event") : null;
  }
  const slow = powers[1]!;
  return state.power > slow ? lever("power", powers, state.power, slow, "event") : null;
}

/** 小鴨剛過、還在同一段、煞車還拉著（小站長拉 B2 讓小鴨）：放開，不然會慢到停住。 */
function afterDucks(state: RunState): NextAction | null {
  const event = activeEvent(state);
  if (!event || event.kind !== "ducks" || !state.events[event.key] || state.brake === 0) return null;
  return lever("brake", brakeNotches(state.course), state.brake, 0, "after-ducks");
}

/**
 * 一次只亮一個：孩子現在該碰哪一個控制。由上往下第一個成立的就是；巡航、等朋友上車、紅燈等車時回 null。
 * 指差鈕顯不顯示仍看 pendingPoint，這裡只決定它亮不亮。
 */
export function nextAction(state: RunState, ctx: NextContext): NextAction | null {
  if (state.phase === "route-done" || state.phase === "reversing" || signalRed(state)) return null;
  if (state.phase === "doors-open") return atDoors(state);
  // 任務卡還在：什麼都不亮，讓孩子先聽完「今天要去接…」（念完卡片自己收，之後才亮「慢」；設計審）。
  if (ctx.mission) return null;
  const task = pendingPoint(state);
  // 示範那一站不出月台題（前窗也不放那顆鈕）。
  const point = task && !(ctx.coachOn && task.kind === "platform") ? button("point", "point") : null;
  // 停著的時候指差題排前面（出站的號誌、停好時還沒做的月台題）；開著進站時煞車優先，煞好了才輪到指差。
  if (state.phase === "stopped") return point ?? button("door", "open");
  if (state.speed <= STILL) return point ?? standing(state, ctx);
  if (state.progress >= currentStation(state).approachAt) return approaching(state, ctx) ?? point;
  return point ?? forEvent(state) ?? afterDucks(state) ?? (bridgeGreetPending(state) ? button("horn", "bridge") : null);
}
