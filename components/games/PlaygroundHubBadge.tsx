import type { CSSProperties } from "react";

type Props = {
  size?: number;
  className?: string;
  style?: CSSProperties;
};

/** 首頁「遊樂園」入口徽章：摩天輪 + 彩旗，歡樂感、非 emoji。 */
export default function PlaygroundHubBadge({
  size = 32,
  className,
  style,
}: Props) {
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
      <circle cx="24" cy="26" r="17" fill="none" stroke="#e4572e" strokeWidth="2.5" />
      <circle cx="24" cy="26" r="2.8" fill="#ffd866" />
      {[0, 60, 120, 180, 240, 300].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const cx = 24 + Math.cos(rad) * 17;
        const cy = 26 + Math.sin(rad) * 17;
        const colors = ["#f7a8c4", "#8fcde8", "#b7df9b", "#c5b3e6", "#ffd866", "#79c8c1"];
        return (
          <g key={deg}>
            <line x1="24" y1="26" x2={cx} y2={cy} stroke="#d4a574" strokeWidth="1.5" />
            <rect
              x={cx - 4.5}
              y={cy - 3.5}
              width="9"
              height="7"
              rx="2"
              fill={colors[deg / 60]}
              transform={`rotate(${deg + 90} ${cx} ${cy})`}
            />
          </g>
        );
      })}
      <path
        d="M10 38h28"
        stroke="#8d857b"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M14 38v-4M34 38v-4" stroke="#8d857b" strokeWidth="2.5" strokeLinecap="round" />
      <path
        d="M6 10l4 2-4 2 1-4 3-1-4-2 4-2-1 4-3 1z"
        fill="#ffd866"
      />
      <path
        d="M42 14l3 1.5-3 1.5.8-3 2.2-.7-3-1.5 3-1.5-.8 3-2.2.7z"
        fill="#f7a8c4"
      />
      <circle cx="8" cy="22" r="2.2" fill="#8fcde8" opacity="0.9" />
      <circle cx="40" cy="8" r="2" fill="#b7df9b" opacity="0.9" />
    </svg>
  );
}
