"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useGamePlayLeaveGuard } from "@/components/games/GamePlayChromeSlot";
import { thumbnailCanvas } from "@/lib/coloring/bitmap";
import { playSfx } from "@/lib/sfx";

export type LeaveTarget = "picker" | "games";

type Options = {
  /** 畫面上有顏色、但這個版本還沒收藏。 */
  unsaved: boolean;
  /** 合成好的畫布（縮圖要跟畫面一致）；還沒載入回 null。 */
  getDisplay: () => HTMLCanvasElement | null;
  /** 回選頁。 */
  onBack: () => void;
  /** 收起來：存目前畫面，失敗要丟錯。 */
  saveNow: () => Promise<void>;
};

/**
 * 畫布上的「換一張／回遊樂園」一律先問，避免小孩誤觸就離開。
 * 有還沒收藏的顏色時，確認離開會先收起來，不把進度丟掉。
 * 瀏覽器返回鍵（客戶端 popstate）不攔。重新整理仍走瀏覽器自己的確認。
 */
export function useColoringLeave({ unsaved, getDisplay, onBack, saveNow }: Options) {
  const router = useRouter();
  const [target, setTarget] = useState<LeaveTarget | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  /** 存檔中按了「繼續塗」：存完就留下，不跳走。 */
  const cancelledRef = useRef(false);

  const leaveTo = useCallback(
    (to: LeaveTarget) => {
      setTarget(null);
      if (to === "games") router.push("/games");
      else onBack();
    },
    [router, onBack],
  );

  const requestLeave = useCallback(
    (to: LeaveTarget) => {
      const display = getDisplay();
      if (display) {
        try {
          setThumbnailUrl(thumbnailCanvas(display).toDataURL("image/png"));
        } catch {
          setThumbnailUrl(null);
        }
      } else {
        setThumbnailUrl(null);
      }
      setError("");
      setTarget(to);
    },
    [getDisplay],
  );

  // 守門函式只註冊一次，讀最新的狀態，不必每次 render 重掛。
  const latest = useRef({ unsaved, requestLeave });
  useEffect(() => {
    latest.current = { unsaved, requestLeave };
  }, [unsaved, requestLeave]);
  const headerGuard = useCallback(() => {
    latest.current.requestLeave("games");
    return false;
  }, []);
  useGamePlayLeaveGuard(headerGuard);

  // 重新整理或關分頁：交給瀏覽器內建的離開確認。
  useEffect(() => {
    if (!unsaved) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = ""; // 舊版 WebView 要有這行才會問
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsaved]);

  const onStay = useCallback(() => {
    cancelledRef.current = true;
    setTarget(null);
  }, []);
  const onDiscard = useCallback(() => {
    if (target) leaveTo(target);
  }, [target, leaveTo]);
  const onGo = useCallback(async () => {
    if (!target) return;
    if (!unsaved) {
      leaveTo(target);
      return;
    }
    cancelledRef.current = false;
    setBusy(true);
    try {
      await saveNow();
      playSfx("collect");
      if (!cancelledRef.current) leaveTo(target);
    } catch {
      setError("沒收好，再按一次試試。");
    } finally {
      setBusy(false);
    }
  }, [target, unsaved, saveNow, leaveTo]);

  return {
    requestLeave,
    sheet: target
      ? {
          thumbnailUrl,
          busy,
          error,
          destination: target,
          unsaved,
          onStay,
          onGo,
          onDiscard,
        }
      : null,
  };
}
