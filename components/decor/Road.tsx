import type { CSSProperties } from "react";

type RoadProps = {
  className?: string;
  style?: CSSProperties;
  height?: number;
};

/** 馬路裝飾：底色路面 + 白色虛線中線。可當 hero 底部或分隔線。 */
export default function Road({ className, style, height = 40 }: RoadProps) {
  return (
    <svg
      viewBox="0 0 300 40"
      preserveAspectRatio="none"
      width="100%"
      height={height}
      className={className}
      style={style}
      aria-hidden
      focusable="false"
    >
      <rect x="0" y="8" width="300" height="32" fill="var(--road)" />
      <line
        x1="0"
        y1="24"
        x2="300"
        y2="24"
        stroke="#fff"
        strokeWidth="4"
        strokeDasharray="20 16"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}
