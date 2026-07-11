"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

const MAX_TILT_DEG = 7;

type CharacterPortraitTiltProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

/**
 * D10-tilt：桌面 pointer 微 3D 傾斜（僅 transform）；手機與 reduced-motion 關閉。
 */
export default function CharacterPortraitTilt({
  children,
  className,
  style,
}: CharacterPortraitTiltProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [motionOk, setMotionOk] = useState(false);

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setMotionOk(!coarse && !reduced);
  }, []);

  const reset = useCallback(() => setTilt(""), []);

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!enabled || !motionOk || event.pointerType !== "mouse") return;
    const node = rootRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    const rotateY = x * MAX_TILT_DEG * 2;
    const rotateX = -y * MAX_TILT_DEG * 2;
    setTilt(
      `perspective(720px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`,
    );
  }, [enabled, motionOk]);

  return (
    <div
      ref={rootRef}
      className={className}
      style={{
        ...style,
        transform: tilt || undefined,
        transition: tilt ? "transform 80ms ease-out" : "transform 220ms ease-out",
      }}
      onPointerEnter={(event) => {
        if (motionOk && event.pointerType === "mouse") setEnabled(true);
      }}
      onPointerLeave={() => {
        setEnabled(false);
        reset();
      }}
      onPointerMove={onPointerMove}
    >
      {children}
    </div>
  );
}
