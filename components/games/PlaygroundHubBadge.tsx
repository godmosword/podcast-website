import { useId } from "react";
import type { CSSProperties } from "react";
import {
  ClayCircle,
  ClayGrad,
  ClaySoftShadow,
  clayIds,
} from "@/lib/games/clay-svg";

type Props = {
  size?: number;
  className?: string;
  style?: CSSProperties;
};

const GONDOLAS = [
  { deg: 0, light: "#ffe8f2", mid: "#f7a8c4", dark: "#e8789c" },
  { deg: 60, light: "#dff6ff", mid: "#8fcde8", dark: "#6eb8d4" },
  { deg: 120, light: "#e8f8dc", mid: "#b7df9b", dark: "#8fc872" },
  { deg: 180, light: "#ebe4ff", mid: "#c5b3e6", dark: "#a892d4" },
  { deg: 240, light: "#fff8e0", mid: "#ffd866", dark: "#e8c84a" },
  { deg: 300, light: "#dff5f2", mid: "#79c8c1", dark: "#5aad9e" },
] as const;

/** 首頁「遊樂園」入口：黏土風迷你摩天輪，配色吃站內 design token。 */
export default function PlaygroundHubBadge({
  size = 36,
  className,
  style,
}: Props) {
  const uid = useId().replace(/:/g, "");
  const sh = clayIds(uid, "sh");

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
      <defs>
        <ClaySoftShadow id={sh} />
        <ClayGrad
          id={clayIds(uid, "rim")}
          light="#ebe4ff"
          mid="#c5b3e6"
          dark="#a892d4"
        />
        <ClayGrad
          id={clayIds(uid, "hub")}
          light="#fff3a8"
          mid="#ffd866"
          dark="#e8c84a"
        />
        <ClayGrad
          id={clayIds(uid, "base")}
          light="#b8e8ff"
          mid="#8fcde8"
          dark="#6eb8d4"
        />
        <linearGradient id={clayIds(uid, "bg")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f4faff" />
          <stop offset="100%" stopColor="#faf5ff" />
        </linearGradient>
        {GONDOLAS.map((g) => (
          <ClayGrad
            key={g.deg}
            id={clayIds(uid, `g${g.deg}`)}
            light={g.light}
            mid={g.mid}
            dark={g.dark}
          />
        ))}
      </defs>

      <circle cx="24" cy="24" r="22" fill={`url(#${clayIds(uid, "bg")})`} />

      <g opacity="0.5">
        <circle cx="10" cy="11" r="1.6" fill="#f7a8c4" />
        <circle cx="38" cy="9" r="1.3" fill="#b7df9b" />
        <circle cx="40" cy="34" r="1.4" fill="#8fcde8" />
      </g>

      <circle
        cx="24"
        cy="25"
        r="15.5"
        fill="none"
        stroke={`url(#${clayIds(uid, "rim")})`}
        strokeWidth="2.8"
        filter={`url(#${sh})`}
      />

      {GONDOLAS.map(({ deg }) => {
        const rad = (deg * Math.PI) / 180;
        const cx = 24 + Math.cos(rad) * 14.5;
        const cy = 25 + Math.sin(rad) * 14.5;
        return (
          <g key={deg}>
            <line
              x1="24"
              y1="25"
              x2={cx}
              y2={cy}
              stroke="#b5ada3"
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.45"
            />
            <g filter={`url(#${sh})`} transform={`rotate(${deg + 90} ${cx} ${cy})`}>
              <rect
                x={cx - 4}
                y={cy - 3}
                width="8"
                height="6"
                rx="2.2"
                fill={`url(#${clayIds(uid, `g${deg}`)})`}
              />
              <ellipse
                cx={cx - 1.2}
                cy={cy - 1.4}
                rx="1.6"
                ry="1"
                fill="#fff"
                opacity="0.42"
              />
            </g>
          </g>
        );
      })}

      <ClayCircle
        cx={24}
        cy={25}
        r={3.2}
        gradId={clayIds(uid, "hub")}
        shadowId={sh}
      />

      <ellipse cx="24" cy="39" rx="14" ry="2.2" fill="rgba(52,48,43,0.08)" />
      <rect
        x="11"
        y="37"
        width="26"
        height="3.5"
        rx="1.8"
        fill={`url(#${clayIds(uid, "base")})`}
        filter={`url(#${sh})`}
      />
    </svg>
  );
}
