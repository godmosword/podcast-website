import type { CSSProperties } from "react";
import decor from "./decor.module.css";

/** 可用的手繪塗鴉造型。 */
type DoodleKind =
  | "squiggle" // 波浪線
  | "loop" // 線圈
  | "dots" // 散點
  | "burst" // 星芒
  | "blob" // 抽象色塊
  | "zigzag"; // 鋸齒

type DoodleProps = {
  kind?: DoodleKind;
  size?: number;
  color?: string;
  /** D7：描邊進場（stroke-dashoffset），首屏一次 */
  draw?: boolean;
  className?: string;
  style?: CSSProperties;
};

/**
 * 手繪塗鴉裝飾（蠟筆/麥克筆風）。
 * 純裝飾、`aria-hidden`，顏色預設吃 currentColor，可由 props / accent token 帶入。
 */
export default function Doodle({
  kind = "squiggle",
  size = 40,
  color = "currentColor",
  draw = false,
  className,
  style,
}: DoodleProps) {
  const drawClass = draw ? decor.doodleDraw : "";
  const mergedClass = [className, drawClass].filter(Boolean).join(" ");

  const common = {
    width: size,
    height: size,
    className: mergedClass,
    style,
    "aria-hidden": true,
    focusable: "false" as const,
  };

  // 線條型用 stroke，色塊型用 fill。
  const stroke = {
    fill: "none",
    stroke: color,
    strokeWidth: 3,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (kind) {
    case "loop":
      return (
        <svg viewBox="0 0 48 48" {...common}>
          <path
            d="M8 30c-4-8 2-18 12-18s14 12 6 18-18 2-18-8 10-16 20-12"
            {...stroke}
          />
        </svg>
      );
    case "dots":
      return (
        <svg viewBox="0 0 48 48" {...common}>
          <circle cx="10" cy="12" r="3.5" fill={color} />
          <circle cx="26" cy="8" r="3" fill={color} />
          <circle cx="38" cy="18" r="3.5" fill={color} />
          <circle cx="14" cy="30" r="3" fill={color} />
          <circle cx="32" cy="34" r="3.5" fill={color} />
          <circle cx="22" cy="22" r="2.5" fill={color} />
        </svg>
      );
    case "burst":
      return (
        <svg viewBox="0 0 48 48" {...common}>
          <g {...stroke}>
            <path d="M24 6v10" />
            <path d="M24 32v10" />
            <path d="M6 24h10" />
            <path d="M32 24h10" />
            <path d="M12 12l7 7" />
            <path d="M29 29l7 7" />
            <path d="M36 12l-7 7" />
            <path d="M19 29l-7 7" />
          </g>
        </svg>
      );
    case "blob":
      return (
        <svg viewBox="0 0 48 48" {...common}>
          <path
            d="M22 6c9-3 20 3 19 13s-6 12-3 19-13 8-21 3S2 33 6 24 13 9 22 6Z"
            fill={color}
          />
        </svg>
      );
    case "zigzag":
      return (
        <svg viewBox="0 0 48 24" {...common}>
          <path d="M3 18l8-12 8 12 8-12 8 12 8-12" {...stroke} />
        </svg>
      );
    case "squiggle":
    default:
      return (
        <svg viewBox="0 0 48 24" {...common}>
          <path
            d="M3 12c4-8 8 8 12 0s8 8 12 0 8 8 12 0"
            {...stroke}
          />
        </svg>
      );
  }
}
