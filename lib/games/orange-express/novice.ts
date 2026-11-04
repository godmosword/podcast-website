import { coachBeat } from "@/lib/games/orange-express/coach";
import { eventPending } from "@/lib/games/orange-express/events";
import { nextAction, type NextAction } from "@/lib/games/orange-express/next-action";
import { createRun, powerNotches, step } from "@/lib/games/orange-express/reducer";
import type { DriverId, LevelId, RunAction, RunState } from "@/lib/games/orange-express/types";

/**
 * 「新手」腳本：模擬一個 5–7 歲第一次玩的孩子，量一趟要開多久（PR-H4，計畫的「多排法＋新手腳本量時間」）。
 * 不是 AI，只是固定的反應時間。PR-J1 起照駕駛台亮的那一個做（`nextAction`）：亮整根動力就推「慢」，
 * 什麼都沒亮時自己把「慢」推到「快」；小站長進站只亮整根煞車桿，等到該拉的時候才拉「停」（會判斷的孩子）。
 * 第二站拉得特別晚、開過頭倒車再停一次（量時間用；照亮的準時拉另見 lateBrake = brakeReact）。
 * 時間只用來調段長段數，不代表真的孩子；真的長度以兒童試玩的碼表為準。
 */
export type NoviceTiming = {
  /** 開局先聽任務卡、看一下才碰桿子（秒）。 */
  firstTouch: number;
  /** 出站：門關了到推動力。 */
  depart: number;
  /** 推了「慢」之後再推到「快」。 */
  慢到快: number;
  /** 聽到事件提示到做動作。 */
  eventReact: number;
  /** 示範說該拉了到真的拉「停」。 */
  brakeReact: number;
  /** 第二站拉得特別晚（開過頭的那一站）。 */
  lateBrake: number;
  /** 停好到按開門；朋友上車完到按關門。 */
  openDoor: number;
  closeDoor: number;
};

export const NOVICE: NoviceTiming = {
  firstTouch: 4,
  depart: 2,
  慢到快: 1.5,
  eventReact: 1.2,
  brakeReact: 0.6,
  lateBrake: 1.6,
  openDoor: 1.8,
  closeDoor: 2.2,
};

const DT = 1 / 30;
/** 跟 View 的「先把煞車放開」一樣：推了動力、煞車沒放、車不走這麼久才亮。 */
const RELEASE_DELAY = 0.9;

/** 亮的那一個要怎麼做：桿子推到亮的那格（整根動力推「慢」、整根煞車拉「停」），按鈕就按。 */
function actionsFor(state: RunState, next: NextAction): RunAction[] {
  if (next.control === "horn") return [{ type: "honk" }];
  if (next.control === "point") return [{ type: "point" }];
  if (next.control === "wave") return [{ type: "wave" }];
  if (next.control === "door") return [{ type: next.reason === "close" ? "close-doors" : "open-doors" }];
  if (next.control === "power") return [{ type: "set-power", notch: next.notch ?? powerNotches(state.course)[1]! }];
  if (next.reason === "brake" || next.reason === "brake-ready") {
    return [
      { type: "set-power", notch: 0 },
      { type: "set-brake", notch: next.notch ?? 3 },
    ];
  }
  return [{ type: "set-brake", notch: next.notch ?? 0 }];
}

/** 看到亮了多久才動手。 */
function delayFor(state: RunState, next: NextAction, timing: NoviceTiming, first: boolean): number {
  switch (next.reason) {
    case "open":
      return timing.openDoor;
    case "close":
      return timing.closeDoor;
    case "greet":
      return 0;
    case "start":
      return first ? timing.firstTouch : timing.depart;
    case "release":
      return timing.depart;
    case "brake":
    case "brake-ready":
      return state.stationIndex === 1 && state.misses === 0 ? timing.lateBrake : timing.brakeReact;
    default:
      return timing.eventReact;
  }
}

/** 開一整趟，回傳秒數與最後的狀態。超過 limit 秒沒到家就停（回傳時 phase 不是 route-done）。 */
export function noviceRun(
  level: LevelId,
  driver: DriverId,
  seed: number,
  timing: NoviceTiming = NOVICE,
  limit = 900,
  start?: RunState,
  /** 第幾幀的時間間隔（秒）；預設固定 30fps。測試用來模擬 60fps 或幀間隔不穩。 */
  dtAt: (frame: number) => number = () => DT,
): { seconds: number; state: RunState } {
  let s = start ?? createRun(level, driver, seed);
  let t = 0;
  /** 排好的下一個動作：時間到了才做（放在物件裡，閉包改得到）。 */
  const queue: { next: { at: number; key: string; actions: RunAction[] } | null } = { next: null };
  const plan = (key: string, delay: number, actions: RunAction[]) => {
    if (queue.next?.key === key) return;
    queue.next = { at: t + delay, key, actions };
  };
  let departedAt = 0;
  let stuckSince: number | null = null;
  let touched = false;
  for (let frame = 0, dt = dtAt(0); t < limit && s.phase !== "route-done"; t += dt, dt = dtAt(++frame)) {
    const moving = s.phase === "running" || s.phase === "in-window";
    const stuck = moving && s.power > 0 && s.brake > 0 && s.speed <= 0.001;
    stuckSince = stuck ? (stuckSince ?? t) : null;
    const beat = coachBeat(s);
    const next = nextAction(s, {
      mission: false,
      releaseHint: stuckSince !== null && t - stuckSince >= RELEASE_DELAY,
      coachOn: false,
      beat,
    });
    const station = s.stations[s.stationIndex]!;
    // 小站長進站只亮整根煞車桿：等到現在拉剛好的時候才拉。
    const waitForBeat = next?.reason === "brake-ready" && beat !== "brake";
    if (next && !waitForBeat) {
      const key = `${next.reason}:${next.control}:${next.notch}:${s.stationIndex}:${s.misses}:${s.phase}`;
      plan(key, delayFor(s, next, timing, !touched), actionsFor(s, next));
      if (next.control === "power") departedAt = t;
    } else if (
      !next &&
      moving &&
      s.power === powerNotches(s.course)[1] &&
      s.brake === 0 &&
      !eventPending(s) &&
      s.progress < station.approachAt
    ) {
      // 什麼都沒亮：自己把「慢」推到「快」。
      plan(`fast:${s.stationIndex}:${Math.floor(s.progress * 4)}`, Math.max(0, timing.慢到快 - (t - departedAt)), [
        { type: "set-power", notch: powerNotches(s.course).at(-1)! },
      ]);
    }
    const due = queue.next;
    if (due && t >= due.at) {
      for (const action of due.actions) s = step(s, action);
      queue.next = null;
      touched = true;
    }
    s = step(s, { type: "tick", dt });
  }
  return { seconds: t, state: s };
}

/** 一組種子的中位數與範圍（秒）。 */
export function noviceStats(seeds: readonly number[], timing: NoviceTiming = NOVICE) {
  const times = seeds.map((seed) => noviceRun("drive", "big", seed, timing).seconds).sort((a, b) => a - b);
  const mid = Math.floor(times.length / 2);
  const median = times.length % 2 ? times[mid]! : (times[mid - 1]! + times[mid]!) / 2;
  return { median, min: times[0]!, max: times[times.length - 1]! };
}
