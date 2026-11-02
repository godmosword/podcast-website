"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** 任務卡：shown 在前窗中間；leaving 正在縮進路線條（減少動態時只淡出）；null 收好了。 */
export type MissionState = "shown" | "leaving" | null;

/** 縮進路線條的動畫長度（CSS 同一個數）。 */
export const MISSION_LEAVE_MS = 600;
/** 音效關著時任務卡留這麼久（還沒碰桿子的話）。 */
export const MISSION_SILENT_MS = 4500;

/**
 * 開局任務卡（大司機）：念完才收，或孩子第一次碰桿子就收，不擋操作。
 * start(ms, onLeave)：顯示，ms 後自己收；開始收的那一刻叫 onLeave 一次（接著廣播下一站）。
 * dismiss()：現在收（碰桿子）；clear()：離開駕駛畫面時直接拿掉，不叫 onLeave。
 */
export function useOrangeExpressMission(): {
  mission: MissionState;
  start: (ms: number, onLeave?: () => void) => void;
  dismiss: () => void;
  clear: () => void;
} {
  const [mission, setMission] = useState<MissionState>(null);
  const missionRef = useRef<MissionState>(null);
  const timer = useRef<number | null>(null);
  const onLeaveRef = useRef<(() => void) | null>(null);

  const set = useCallback((next: MissionState) => {
    missionRef.current = next;
    setMission(next);
  }, []);

  const stopTimer = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const dismiss = useCallback(() => {
    if (missionRef.current !== "shown") return;
    stopTimer();
    set("leaving");
    const onLeave = onLeaveRef.current;
    onLeaveRef.current = null;
    onLeave?.();
    timer.current = window.setTimeout(() => {
      timer.current = null;
      set(null);
    }, MISSION_LEAVE_MS);
  }, [set, stopTimer]);

  const start = useCallback(
    (ms: number, onLeave?: () => void) => {
      stopTimer();
      onLeaveRef.current = onLeave ?? null;
      set("shown");
      timer.current = window.setTimeout(() => {
        timer.current = null;
        dismiss();
      }, ms);
    },
    [dismiss, set, stopTimer],
  );

  const clear = useCallback(() => {
    stopTimer();
    onLeaveRef.current = null;
    set(null);
  }, [set, stopTimer]);

  useEffect(() => stopTimer, [stopTimer]);

  return { mission, start, dismiss, clear };
}
