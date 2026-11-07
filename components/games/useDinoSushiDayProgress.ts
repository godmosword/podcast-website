"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DinoSushiInstance } from "@/lib/gamekit/games/dino-sushi/adapter";
import { loadDinoSushiDays, saveDinoSushiDays } from "@/lib/gamekit/progress/dino-sushi-days";
import { loadPlayerProfile } from "@/lib/gamekit/progress/save";
import { GAMEKIT_PROGRESS_EVENT } from "@/lib/gamekit/progress/session";
import { emptyDayFlags, mergeDayFlags, withDayFlags } from "@/lib/games/dino-sushi/day-progress";
import { DINO_SUSHI_LEVEL_INDEX } from "@/lib/games/dino-sushi/medals";
import { PROGRESS_CHANGE_EVENT } from "@/lib/progress-keys";

export const ROUND_SAVE_ERROR = "這一輪沒存好。";

export function storedClassicFlags(): number {
  return loadPlayerProfile().medals["dino-sushi"]?.[DINO_SUSHI_LEVEL_INDEX] ?? 0;
}

/**
 * 壽司屋的關卡進度。存檔寫不進去（localStorage 滿了）時，這輪成果留在記憶體：
 * 下一天照樣開著，重讀存檔也不會鎖回去；提示「再存一次」，或下一輪存得進去時一起寫。
 */
export function useDinoSushiDayProgress(instance: Pick<DinoSushiInstance, "flushSessions">) {
  const [dayFlags, setDayFlags] = useState<number[]>(() =>
    typeof window === "undefined" ? emptyDayFlags() : loadDinoSushiDays(),
  );
  const [classicFlags, setClassicFlags] = useState(() => (typeof window === "undefined" ? 0 : storedClassicFlags()));
  const [daysUnsaved, setDaysUnsaved] = useState(false);
  const [reportUnsaved, setReportUnsaved] = useState(false);
  const unsaved = useRef<readonly number[]>(emptyDayFlags());

  const refresh = useCallback(() => {
    setDayFlags(mergeDayFlags(loadDinoSushiDays(), unsaved.current));
    setClassicFlags(storedClassicFlags());
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(GAMEKIT_PROGRESS_EVENT, refresh);
    window.addEventListener(PROGRESS_CHANGE_EVENT, refresh);
    return () => {
      window.removeEventListener(GAMEKIT_PROGRESS_EVENT, refresh);
      window.removeEventListener(PROGRESS_CHANGE_EVENT, refresh);
    };
  }, [refresh]);

  const writeDays = useCallback((pending: readonly number[]): number[] => {
    /* 先記下再寫：寫成功時的進度事件會同步觸發 refresh，要讀得到這一輪 */
    unsaved.current = pending;
    const { ok, days } = saveDinoSushiDays(pending);
    if (ok) unsaved.current = emptyDayFlags();
    setDaysUnsaved(!ok);
    setDayFlags(days);
    return days;
  }, []);

  /** 記下這一輪的星星，連同之前沒存好的一起寫。回傳算進這一輪的八天，不會丟例外。 */
  const recordDay = useCallback(
    (day: number, flags: number) => writeDays(withDayFlags(unsaved.current, day, flags)),
    [writeDays],
  );

  /** Host 那邊的回報（玩過、活動紀錄、第 4 天的舊獎牌）有沒有寫進去。 */
  const noteReport = useCallback((ok: boolean) => {
    setReportUnsaved(!ok);
  }, []);

  const retry = useCallback(() => {
    writeDays(unsaved.current);
    setReportUnsaved(!instance.flushSessions());
  }, [instance, writeDays]);

  return {
    dayFlags,
    classicFlags,
    saveFailed: daysUnsaved || reportUnsaved,
    recordDay,
    noteReport,
    retry,
  };
}
