import type { CSSProperties } from "react";

type CloudProps = {
  className?: string;
  style?: CSSProperties;
  width?: number;
};

/** 雲朵裝飾（使用 --cloud 色）。 */
export default function Cloud({ className, style, width = 120 }: CloudProps) {
  return (
    <svg
      viewBox="0 0 120 60"
      width={width}
      height={(width * 60) / 120}
      className={className}
      style={style}
      aria-hidden
      focusable="false"
    >
      <g fill="var(--cloud)">
        <ellipse cx="40" cy="38" rx="34" ry="20" />
        <ellipse cx="70" cy="30" rx="26" ry="22" />
        <ellipse cx="94" cy="40" rx="22" ry="16" />
        <rect x="18" y="40" width="84" height="17" rx="8.5" />
      </g>
    </svg>
  );
}
