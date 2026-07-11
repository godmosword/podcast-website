import type { IconName } from "@/data/icons";
import { DEFAULT_ICON_SIZE } from "@/data/icons";

export type IconProps = {
  name: IconName;
  size?: number;
  className?: string;
};

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function svgProps(size: number, className?: string) {
  return {
    viewBox: "0 0 24 24",
    width: size,
    height: size,
    className,
    "aria-hidden": true as const,
    focusable: "false" as const,
  };
}

function renderGlyph(name: IconName) {
  switch (name) {
    case "play":
      return <path d="M8 5.5v13l11-6.5z" fill="currentColor" />;
    case "external":
      return (
        <>
          <path d="M7 17 17 7" {...STROKE} />
          <path d="M9.5 7H17v7.5" {...STROKE} />
        </>
      );
    case "pause":
      return (
        <>
          <rect x="7" y="5" width="3.6" height="14" rx="1.4" fill="currentColor" />
          <rect x="13.4" y="5" width="3.6" height="14" rx="1.4" fill="currentColor" />
        </>
      );
    case "close":
    case "menu-close":
      return (
        <g {...STROKE}>
          <path d="M6 6l12 12M18 6L6 18" />
        </g>
      );
    case "menu":
      return (
        <g {...STROKE}>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </g>
      );
    case "chevron-right":
      return (
        <g {...STROKE}>
          <path d="M9 6l6 6-6 6" />
        </g>
      );
    case "settings":
      return (
        <g {...STROKE}>
          <circle cx="12" cy="12" r="3.2" />
          <path d="M12 2.8v2.2M12 19v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.8 12h2.2M19 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" />
        </g>
      );
    case "volume-on":
      return (
        <g {...STROKE}>
          <path d="M5 9.5v5h3.5L14 19V5L8.5 9.5H5z" fill="currentColor" stroke="none" />
          <path d="M16.5 9.5a3.5 3.5 0 0 1 0 5M18.8 7.2a6.5 6.5 0 0 1 0 9.6" />
        </g>
      );
    case "volume-off":
      return (
        <g {...STROKE}>
          <path d="M5 9.5v5h3.5L14 19V5L8.5 9.5H5z" fill="currentColor" stroke="none" />
          <path d="M17 9l4 6M21 9l-4 6" />
        </g>
      );
    case "bell":
      return (
        <path
          d="M12 2a1.5 1.5 0 0 1 1.5 1.5v.58A6.5 6.5 0 0 1 18.5 10.5v3.9l1.35 2.43a1 1 0 0 1-.87 1.49H5.02a1 1 0 0 1-.87-1.49L5.5 14.4v-3.9a6.5 6.5 0 0 1 5-6.32V3.5A1.5 1.5 0 0 1 12 2Zm-2.45 17.32h4.9a2.45 2.45 0 0 1-4.9 0Z"
          fill="currentColor"
        />
      );
    case "timer":
      return (
        <g {...STROKE}>
          <circle cx="12" cy="13" r="7.5" />
          <path d="M12 9.5V13l2.8 2.2M9.5 3.5h5" />
        </g>
      );
    case "text-size":
      return (
        <g {...STROKE}>
          <path d="M5 18 9 6l4 12M6.4 13.5h5.2" />
          <path d="M16 8.5h4M18 8.5v9M16 17.5h4" />
        </g>
      );
    default: {
      const _exhaustive: never = name;
      return _exhaustive;
    }
  }
}

/** 全站線性 SVG 圖示；裝飾用標 aria-hidden，按鈕內由 IconButton 提供 aria-label。 */
export default function Icon({ name, size = DEFAULT_ICON_SIZE, className }: IconProps) {
  return <svg {...svgProps(size, className)}>{renderGlyph(name)}</svg>;
}
