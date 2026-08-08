"use client";

import { useEffect, useRef, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import styles from "./touch-controls.module.css";

export { styles as touchControlStyles };

type PointerHandlers = {
  onDown: () => void;
  onUp?: () => void;
};

/** 同一 pointer 只觸發一次 onUp（cancel / lost 可能連續觸發）。 */
function useCapturedPress(onDown: () => void, onUp?: () => void) {
  const pressedRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const onUpRef = useRef(onUp);
  onUpRef.current = onUp;

  useEffect(
    () => () => {
      if (!pressedRef.current) return;
      pressedRef.current = false;
      pointerIdRef.current = null;
      onUpRef.current?.();
    },
    [],
  );

  const release = (el: HTMLButtonElement, pointerId: number) => {
    try {
      if (el.hasPointerCapture?.(pointerId)) {
        el.releasePointerCapture(pointerId);
      }
    } catch {
      // 部分環境不支援 capture
    }
  };

  const handleDown = (e: PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // 部分環境不支援 capture
    }
    if (pressedRef.current) return;
    pressedRef.current = true;
    pointerIdRef.current = e.pointerId;
    onDown();
  };

  const handleUp = (e: PointerEvent<HTMLButtonElement>) => {
    if (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) return;
    release(e.currentTarget, e.pointerId);
    if (!pressedRef.current) return;
    pressedRef.current = false;
    pointerIdRef.current = null;
    onUp?.();
  };

  return { handleDown, handleUp };
}

/** 方塊遊戲用：深色網格虛擬鍵（≥44×44px）。 */
export function GridTouchButton({
  label,
  children,
  coarse,
  wide,
  onDown,
  onUp,
}: {
  label: string;
  children: ReactNode;
  coarse?: boolean;
  wide?: boolean;
} & PointerHandlers) {
  const { handleDown, handleUp } = useCapturedPress(onDown, onUp);
  const extraClass = coarse
    ? wide
      ? styles.coarseBtnWide
      : styles.coarseBtn
    : "";
  return (
    <button
      type="button"
      aria-label={label}
      className={extraClass || undefined}
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
      onLostPointerCapture={handleUp}
      style={{
        minWidth: coarse ? 56 : 52,
        minHeight: coarse ? 56 : 52,
        border: "none",
        background: "rgba(255,255,255,.1)",
        color: "#fff",
        borderRadius: 14,
        fontSize: coarse ? 26 : 22,
        cursor: "pointer",
        touchAction: "manipulation",
      }}
    >
      {children}
    </button>
  );
}

/** 平台遊戲用：橫向觸控列虛擬鍵（≥44×44px）。 */
export function BarTouchButton({
  children,
  label,
  big,
  coarse,
  onDown,
  onUp,
  style,
}: {
  children: ReactNode;
  label: string;
  big?: boolean;
  coarse?: boolean;
  style?: CSSProperties;
} & Required<Pick<PointerHandlers, "onDown" | "onUp">>) {
  const { handleDown, handleUp } = useCapturedPress(onDown, onUp);
  const up = (e: PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    handleUp(e);
  };
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={handleDown}
      onPointerUp={up}
      onPointerCancel={up}
      onLostPointerCapture={up}
      className={
        coarse
          ? big
            ? styles.coarseBtnWide
            : styles.coarseBtn
          : undefined
      }
      style={{
        border: "none",
        background: big
          ? "linear-gradient(180deg,#5bd0ff,#2f9fe0)"
          : "#fff",
        color: big ? "#06324a" : "#333",
        borderRadius: 16,
        minWidth: big ? (coarse ? 160 : 130) : coarse ? 72 : 64,
        height: coarse ? 72 : 64,
        fontSize: big ? (coarse ? 24 : 22) : coarse ? 30 : 26,
        fontWeight: 800,
        cursor: "pointer",
        boxShadow: "0 4px 0 rgba(0,0,0,.2)",
        touchAction: "none",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
