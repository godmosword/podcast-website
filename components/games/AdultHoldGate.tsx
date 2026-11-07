"use client";

import { useEffect, useId, useRef, useState, type Ref } from "react";
import Icon from "@/components/ui/Icon";
import styles from "./AdultHoldGate.module.css";

/** 小孩短按不會打開；大人按住約 0.7 秒，或鍵盤 Enter／空白鍵。 */
export const ADULT_HOLD_MS = 700;
/** 短按後「請大人按住」提示留多久。 */
export const ADULT_HINT_MS = 2400;

export type AdultHoldGateProps = {
  /** 外觀與位置（邊框、底色、格線位置）由呼叫端決定；按住環、提示泡泡由這裡畫。 */
  className: string;
  open: boolean;
  onOpen: () => void;
  triggerRef?: Ref<HTMLButtonElement>;
  label?: string;
};

/**
 * 家長工具的齒輪：按住才打開。短按（小孩亂點，或大人以為點一下就好）時
 * 在齒輪下方冒「大人請按住」，免得看起來像按鈕壞掉；只用字，不用動畫示範「按久一點」，
 * 不然等於教孩子怎麼打開。右下角的小鎖跟抬頭「遊戲設定」齒輪（點一下就開）分開。
 */
export function AdultHoldGate({ className, open, onOpen, triggerRef, label = "家長工具" }: AdultHoldGateProps) {
  const [holding, setHolding] = useState(false);
  const [hinting, setHinting] = useState(false);
  const hintId = useId();
  const holdTimer = useRef<number | null>(null);
  const hintTimer = useRef<number | null>(null);
  const suppressClick = useRef(false);

  const clearHold = () => {
    setHolding(false);
    if (holdTimer.current !== null) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  const showHint = () => {
    if (hintTimer.current !== null) window.clearTimeout(hintTimer.current);
    setHinting(true);
    hintTimer.current = window.setTimeout(() => {
      hintTimer.current = null;
      setHinting(false);
    }, ADULT_HINT_MS);
  };

  useEffect(
    () => () => {
      if (holdTimer.current !== null) window.clearTimeout(holdTimer.current);
      if (hintTimer.current !== null) window.clearTimeout(hintTimer.current);
    },
    [],
  );

  const openNow = () => {
    if (hintTimer.current !== null) window.clearTimeout(hintTimer.current);
    hintTimer.current = null;
    setHinting(false);
    onOpen();
  };

  return (
    <button
      ref={triggerRef}
      type="button"
      className={`${styles.gate} ${className}`}
      data-holding={holding ? "true" : undefined}
      data-hinting={hinting ? "true" : undefined}
      aria-label={label}
      aria-expanded={open}
      aria-haspopup="dialog"
      aria-describedby={hintId}
      onPointerDown={() => {
        clearHold();
        setHolding(true);
        holdTimer.current = window.setTimeout(() => {
          holdTimer.current = null;
          suppressClick.current = true;
          setHolding(false);
          openNow();
        }, ADULT_HOLD_MS);
      }}
      onPointerUp={() => {
        // 還在計時＝沒按滿就放開：提示要按住
        if (holdTimer.current !== null) showHint();
        clearHold();
      }}
      onPointerCancel={clearHold}
      onPointerLeave={clearHold}
      onContextMenu={(event) => event.preventDefault()}
      onClick={(event) => {
        if (!suppressClick.current) return;
        suppressClick.current = false;
        event.preventDefault();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        openNow();
      }}
    >
      <Icon name="settings" size={24} />
      <svg className={styles.lock} viewBox="0 0 16 16" aria-hidden focusable="false">
        <circle cx="8" cy="8" r="8" />
        <rect x="4.5" y="7.2" width="7" height="5.3" rx="1.2" />
        <path d="M6 7.2V5.8a2 2 0 0 1 4 0v1.4" />
      </svg>
      <svg className={styles.holdRing} viewBox="0 0 48 48" aria-hidden focusable="false">
        <circle cx="24" cy="24" r="20" />
      </svg>
      <span id={hintId} className={styles.srOnly}>
        按住才會打開
      </span>
      {/* 看得到的提示：短按才出現。讀屏已經有 aria-describedby，這裡不重念。 */}
      {hinting ? (
        <span className={styles.hint} aria-hidden data-testid="adult-gate-hint">
          大人請按住
        </span>
      ) : null}
    </button>
  );
}
