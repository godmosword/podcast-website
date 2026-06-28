import { useEffect, useRef, useState } from "react";
import type { ZoneStatus } from "@/data/universe-zones";

export const ZONE_TRANSITION_MS = 700;

function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  const prev = ref.current;
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return prev;
}

/** 一次性轉場 key，供 data-transition 使用 */
export function getTransitionKey(from: ZoneStatus, to: ZoneStatus): string | null {
  if (from === to) return null;
  return `${from}-to-${to}`;
}

/**
 * 偵測 status 變更並回傳一次性轉場 key。
 * reduced：不同步播過場（直接呈現最終態）。
 * 非 reduced：animationend 或超時保護清除 transition 態。
 */
export function useZoneTransition(status: ZoneStatus, reduced: boolean) {
  const prev = usePrevious(status);
  const [transition, setTransition] = useState<string | null>(null);

  useEffect(() => {
    if (prev === undefined || prev === status) return;
    const key = getTransitionKey(prev, status);
    if (!key) return;

    if (reduced) {
      setTransition(null);
      return;
    }

    setTransition(key);
    const timeout = window.setTimeout(
      () => setTransition(null),
      ZONE_TRANSITION_MS + 200,
    );
    return () => window.clearTimeout(timeout);
  }, [status, prev, reduced]);

  const onTransitionEnd = () => setTransition(null);

  return { transition, onTransitionEnd };
}
