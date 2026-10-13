"use client";

import { useRef, type ButtonHTMLAttributes, type PointerEvent, type MouseEvent } from "react";
import TapHand from "@/components/ui/TapHand";
import styles from "./DinoSushiKitchen.module.css";

/** 首單教學的手指：指尖落在被提示的那顆裡面、手身不壓到別顆（位置與尺寸見 .finger）。 */
export function TapFinger() {
  return (
    <span className={styles.finger} aria-hidden data-tap-hand>
      <TapHand />
    </span>
  );
}

/** 放開的位置，以及被點的那顆鈕當下的框。 */
export type TapPoint = { x: number; y: number; rect: DOMRect };

type TapButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "type"> & {
  /** point：觸控／滑鼠放開的位置；鍵盤觸發時沒有。 */
  onTap: (point?: TapPoint) => void;
};

/**
 * 兒童按鈕的點按判定：觸控／滑鼠在 pointerup 判 tap（按下與放開在同一顆鈕內才算），
 * click 只處理鍵盤觸發（detail===0）。避免觸控同時觸發 pointer 與 click 而加兩次料。
 */
export function TapButton({ onTap, onPointerDown, onPointerUp, onPointerCancel, ...rest }: TapButtonProps) {
  const downId = useRef<number | null>(null);

  const handleDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button === 0) downId.current = e.pointerId;
    onPointerDown?.(e);
  };

  const handleUp = (e: PointerEvent<HTMLButtonElement>) => {
    const pressed = downId.current === e.pointerId;
    downId.current = null;
    onPointerUp?.(e);
    if (!pressed || rest.disabled) return;
    const r = e.currentTarget.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (inside) onTap({ x: e.clientX, y: e.clientY, rect: r });
  };

  const handleCancel = (e: PointerEvent<HTMLButtonElement>) => {
    downId.current = null;
    onPointerCancel?.(e);
  };

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (e.detail === 0) onTap();
  };

  return (
    <button
      type="button"
      {...rest}
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      onPointerCancel={handleCancel}
      onClick={handleClick}
    />
  );
}
