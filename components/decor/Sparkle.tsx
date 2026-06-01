import type { CSSProperties } from "react";

type SparkleProps = {
  size?: number;
  color?: string;
  className?: string;
  style?: CSSProperties;
};

/** 四角星閃光裝飾。 */
export default function Sparkle({
  size = 18,
  color = "var(--sun)",
  className,
  style,
}: SparkleProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      style={style}
      aria-hidden
      focusable="false"
    >
      <path
        d="M12 0c1 7 5 11 12 12-7 1-11 5-12 12-1-7-5-11-12-12C7 11 11 7 12 0Z"
        fill={color}
      />
    </svg>
  );
}
