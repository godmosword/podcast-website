import type { CSSProperties } from "react";

type WheelProps = {
  size?: number;
  color?: string;
  className?: string;
  style?: CSSProperties;
};

/** 輪胎圖示，可當 loading spinner（搭配 decor.module.css 的 .spin）。 */
export default function Wheel({
  size = 48,
  color = "var(--ink)",
  className,
  style,
}: WheelProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      style={style}
      aria-hidden
      focusable="false"
    >
      <circle cx="24" cy="24" r="22" fill="#33312e" />
      {/* 胎紋 */}
      <circle
        cx="24"
        cy="24"
        r="20"
        fill="none"
        stroke="#22201d"
        strokeWidth="4"
        strokeDasharray="3 5.6"
      />
      {/* 輪轂 */}
      <circle cx="24" cy="24" r="13" fill={color} />
      <g stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity="0.9">
        <line x1="24" y1="13" x2="24" y2="35" />
        <line x1="13" y1="24" x2="35" y2="24" />
        <line x1="16.2" y1="16.2" x2="31.8" y2="31.8" />
        <line x1="31.8" y1="16.2" x2="16.2" y2="31.8" />
      </g>
      <circle cx="24" cy="24" r="4.2" fill="#fff" />
    </svg>
  );
}
