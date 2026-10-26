"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useGamePlayLeaveGuard } from "@/components/games/GamePlayChromeSlot";
import { thumbnailCanvas } from "@/lib/coloring/bitmap";
import { playSfx } from "@/lib/sfx";

export type LeaveTarget = "picker" | "games" | "back";

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
 * 有還沒收藏的顏色時，站內連結與瀏覽器返回也先問；確認離開會先收起來。
 * 不做自動續塗。重新整理仍走瀏覽器自己的確認。
 */
export function useColoringLeave({ unsaved, getDisplay, onBack, saveNow }: Options) {
  const router = useRouter();
  const [target, setTarget] = useState<LeaveTarget | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  /** 存檔中按了「繼續塗」：存完就留下，不跳走。 */
  const cancelledRef = useRef(false);
  /** 確認離開之後的 popstate 不要再把人拉回來。 */
  const bypassRef = useRef(false);
  const pendingHref = useRef<string | null>(null);

  const leaveTo = useCallback(
    (to: LeaveTarget) => {
      const href = pendingHref.current;
      pendingHref.current = null;
      setTarget(null);
      bypassRef.current = true;
      if (to === "back") {
        if (href) router.push(href);
        else window.history.go(-2);
        return;
      }
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

  // 有還沒收藏的顏色時，站內返回先問。多推一層同一個網址，
  // 第一次返回還在著色頁，才有機會把離開卡秀出來。
  useEffect(() => {
    if (!unsaved) return;
    bypassRef.current = false;
    window.history.pushState({ coloringLeaveGuard: true }, "");
    const onPop = () => {
      if (bypassRef.current || !latest.current.unsaved) return;
      pendingHref.current = null;
      window.history.pushState({ coloringLeaveGuard: true }, "");
      latest.current.requestLeave("back");
    };
    const onClick = (event: MouseEvent) => {
      if (bypassRef.current || !latest.current.unsaved) return;
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      const targetNode = event.target;
      if (!(targetNode instanceof Element)) return;
      const anchor = targetNode.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      event.preventDefault();
      event.stopPropagation();
      pendingHref.current = `${url.pathname}${url.search}${url.hash}`;
      latest.current.requestLeave(url.pathname === "/games" ? "games" : "back");
    };
    window.addEventListener("popstate", onPop);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("popstate", onPop);
      document.removeEventListener("click", onClick, true);
    };
  }, [unsaved]);

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
