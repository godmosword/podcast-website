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

/**
 * 從托盤開始的捲動：手指移動超過這個距離就當成滑動，不選料。
 * 用螢幕座標（client），頁面跟著捲時手指也移動了，才不會把滑動算成點。
 */
export const TAP_MOVE_PX = 10;

type TapButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "type"> & {
  /** point：觸控／滑鼠放開的位置；鍵盤觸發時沒有。 */
  onTap: (point?: TapPoint) => void;
};

type PointerStart = { id: number; x: number; y: number };

/**
 * 兒童按鈕的點按判定：觸控／滑鼠在 pointerup 判 tap（按下與放開在同一顆鈕內、移動不超過門檻才算），
 * click 只處理鍵盤觸發（detail===0）。避免觸控同時觸發 pointer 與 click 而加兩次料，也避開 300ms 延遲。
 */
export function TapButton({ onTap, onPointerDown, onPointerUp, onPointerCancel, ...rest }: TapButtonProps) {
  const down = useRef<PointerStart | null>(null);

  const handleDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button === 0) down.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    onPointerDown?.(e);
  };

  const handleUp = (e: PointerEvent<HTMLButtonElement>) => {
    const start = down.current;
    down.current = null;
    onPointerUp?.(e);
    if (!start || start.id !== e.pointerId || rest.disabled) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (dx * dx + dy * dy > TAP_MOVE_PX * TAP_MOVE_PX) return;
    const r = e.currentTarget.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (inside) onTap({ x: e.clientX, y: e.clientY, rect: r });
  };

  const handleCancel = (e: PointerEvent<HTMLButtonElement>) => {
    down.current = null;
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
