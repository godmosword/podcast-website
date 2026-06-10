"use client";

import type { CSSProperties, PointerEvent, ReactNode } from "react";
import styles from "./touch-controls.module.css";

export { styles as touchControlStyles };

type PointerHandlers = {
  onDown: () => void;
  onUp?: () => void;
};

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
      onPointerDown={(e) => {
        e.preventDefault();
        onDown();
      }}
      onPointerUp={onUp}
      onPointerLeave={onUp}
      onPointerCancel={onUp}
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
  const down = (e: PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onDown();
  };
  const up = (e: PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onUp();
  };
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={down}
      onPointerUp={up}
      onPointerLeave={up}
      onPointerCancel={up}
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
