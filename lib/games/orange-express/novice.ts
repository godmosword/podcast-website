import { coachBeat } from "@/lib/games/orange-express/coach";
import { eventPending } from "@/lib/games/orange-express/events";
import { createRun, landmarkTaskPending, step } from "@/lib/games/orange-express/reducer";
import type { DriverId, LevelId, RunAction, RunState } from "@/lib/games/orange-express/types";

/**
 * 「新手」腳本：模擬一個 5–7 歲第一次玩的孩子，量一趟要開多久（PR-H4，計畫的「多排法＋新手腳本量時間」）。
 * 不是 AI，只是固定的反應時間：每件事看到了要過一會兒才動手；推動力先推「慢」再推「快」；
 * 進站拉「停」拉得晚一點，第二站拉得更晚、開過頭倒車再停一次；開門、關門都要找一下按鈕。
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

/** 開一整趟，回傳秒數與最後的狀態。超過 limit 秒沒到家就停（回傳時 phase 不是 route-done）。 */
export function noviceRun(
  level: LevelId,
  driver: DriverId,
  seed: number,
  timing: NoviceTiming = NOVICE,
  limit = 900,
  start?: RunState,
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
  for (; t < limit && s.phase !== "route-done"; t += DT) {
    const event = eventPending(s);
    const station = s.stations[s.stationIndex]!;
    if (s.phase === "stopped") {
      plan(`open:${s.stationIndex}:${s.misses}`, timing.openDoor, [{ type: "open-doors" }]);
    } else if (s.phase === "doors-open") {
      if (landmarkTaskPending(s)) s = step(s, { type: "honk" });
      if (s.boarded >= station.passengers.length) {
        plan(`close:${s.stationIndex}`, timing.closeDoor, [
          { type: "set-brake", notch: 0 },
          { type: "close-doors" },
        ]);
      }
    } else if (s.phase === "running" || s.phase === "in-window") {
      if (s.progress > s.stations[s.stationIndex]!.approachAt && coachBeat(s) === "brake" && s.brake === 0) {
        const late = s.stationIndex === 1 && s.misses === 0 ? timing.lateBrake : timing.brakeReact;
        plan(`brake:${s.stationIndex}:${s.misses}`, late, [
          { type: "set-power", notch: 0 },
          { type: "set-brake", notch: 3 },
        ]);
      } else if (event && !s.events[event.key]) {
        const action: RunAction[] =
          event.kind === "ducks"
            ? [{ type: "set-power", notch: 2 }]
            : event.kind === "race"
              ? [{ type: "set-power", notch: 4 }]
              : [{ type: "honk" }];
        plan(`event:${event.key}`, timing.eventReact, action);
      } else if (s.speed === 0 && s.power === 0 && s.brake === 0) {
        // 停著（開局、出站、倒車退好）：先推「慢」。
        const first = t === 0 && s.stationIndex === 0;
        plan(`go:${s.stationIndex}:${s.misses}:${s.progress.toFixed(3)}`, first ? timing.firstTouch : timing.depart, [
          { type: "set-power", notch: 2 },
        ]);
        departedAt = t;
      } else if (s.speed === 0 && s.brake > 0 && s.phase === "running") {
        // 倒車退好、煞車還拉著：放開煞車再推。
        plan(`release:${s.stationIndex}:${s.misses}`, timing.depart, [
          { type: "set-brake", notch: 0 },
          { type: "set-power", notch: 2 },
        ]);
      } else if (s.power === 2 && s.brake === 0 && !event && s.progress < station.approachAt) {
        plan(`fast:${s.stationIndex}:${Math.floor(s.progress * 4)}`, Math.max(0, timing.慢到快 - (t - departedAt)), [
          { type: "set-power", notch: 4 },
        ]);
      }
    }
    const due = queue.next;
    if (due && t >= due.at) {
      for (const action of due.actions) s = step(s, action);
      queue.next = null;
    }
    s = step(s, { type: "tick", dt: DT });
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
