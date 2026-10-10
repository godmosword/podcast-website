"use client";

import { useRef, type ButtonHTMLAttributes, type PointerEvent, type MouseEvent } from "react";

type TapButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "type"> & {
  onTap: () => void;
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
    if (inside) onTap();
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
