import type { IconName } from "@/data/icons";
import { DEFAULT_ICON_SIZE } from "@/data/icons";

export type IconProps = {
  name: IconName;
  size?: number;
  className?: string;
};

/**
 * 線寬寫在根 <svg> 上讓子元素繼承（見 lineWidthFor），所以這裡不寫 strokeWidth。
 * 其他元件自畫同一套線性圖時用 ICON_LINE（含 2 的線寬）。
 */
const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** 全站線性圖示的畫法：24 格、2 單位線、圓角收尾、跟字色走。 */
export const ICON_LINE = { ...STROKE, strokeWidth: 2 };

/**
 * 線寬（viewBox 單位）。24 格畫 2 單位線，圖示縮小時線也跟著變細：14px 只剩約 1.2px，
 * 比旁邊 20px 的圖示和粗字淡一截。小於 20px 時補到「實際約 1.67px」，和 20px 的預設尺寸一樣粗。
 */
export function lineWidthFor(size: number): number {
  return size < DEFAULT_ICON_SIZE ? Math.round(((2 * DEFAULT_ICON_SIZE) / size) * 100) / 100 : 2;
}

function svgProps(size: number, className?: string) {
  return {
    viewBox: "0 0 24 24",
    width: size,
    height: size,
    className,
    strokeWidth: lineWidthFor(size),
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
    case "chevron-down":
      return (
        <g {...STROKE}>
          <path d="m6 9.5 6 6 6-6" />
        </g>
      );
    case "arrow-left":
      return (
        <g {...STROKE}>
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </g>
      );
    case "arrow-right":
      return (
        <g {...STROKE}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </g>
      );
    case "check":
      return (
        <g {...STROKE}>
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        </g>
      );
    case "link":
      return (
        <g {...STROKE}>
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </g>
      );
    case "home":
      return (
        <g {...STROKE}>
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5.5 10.5V20h13v-9.5" />
          <path d="M10 20v-5h4v5" />
        </g>
      );
    case "settings":
      // 齒輪，不用「圓心＋光芒」：那是亮度符號，跟遊戲抬頭的日夜切換並排時會被看成「切白天」
      return (
        <g {...STROKE}>
          <circle cx="12" cy="12" r="3" />
          <path d="M10.3 3h3.4l.5 2.4 1.7.7 2-1.4 2.4 2.4-1.4 2 .7 1.7 2.4.5v3.4l-2.4.5-.7 1.7 1.4 2-2.4 2.4-2-1.4-1.7.7-.5 2.4h-3.4l-.5-2.4-1.7-.7-2 1.4-2.4-2.4 1.4-2-.7-1.7L3 13.7v-3.4l2.4-.5.7-1.7-1.4-2 2.4-2.4 2 1.4 1.7-.7z" />
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
      // 美術審 L2：原本「A」＋「I」讀成 AI，改成大 A 小 a（單層 a：圓＋右豎）才是字級。
      return (
        <g {...STROKE}>
          <path d="M3.5 18 8 6l4.5 12M5.2 13.5h5.6" />
          <circle cx="17.5" cy="14.5" r="3.2" />
          <path d="M20.7 11.3V18" />
        </g>
      );
    case "book":
      return (
        <g {...STROKE}>
          <path d="M3 5.5c2.6-1 5.6-.7 9 1.3v12.6c-3.4-2-6.4-2.3-9-1.3z" />
          <path d="M21 5.5c-2.6-1-5.6-.7-9 1.3v12.6c3.4-2 6.4-2.3 9-1.3z" />
        </g>
      );
    case "car":
      // 側面小車＋一隻眼睛，對齊站上的車車 logo；正面帶臉的版本縮到 24px 會像遊戲手把
      return (
        <g {...STROKE}>
          <path d="M5 16.5H3.5v-3.8c0-.6.4-1.1 1-1.3l2-.6 2.4-3.5c.3-.5.8-.8 1.4-.8h4.5c.6 0 1.1.3 1.4.7l2.6 3.6 1.7.5c.6.2 1 .7 1 1.3v3.9H19" />
          <path d="M9 16.5h6" />
          <circle cx="7" cy="16.5" r="2" />
          <circle cx="17" cy="16.5" r="2" />
          <path d="M14.5 11.4h.01" />
        </g>
      );
    case "ferris-wheel":
      return (
        <g {...STROKE}>
          <circle cx="12" cy="10" r="6.5" />
          <circle cx="12" cy="10" r="1.3" />
          <path d="M12 3.5v13M5.5 10h13M7.4 5.4l9.2 9.2M16.6 5.4l-9.2 9.2M9 21l3-4.8 3 4.8M7.5 21h9" />
        </g>
      );
    case "map":
      return (
        <g {...STROKE}>
          <path d="M3.5 6.5 9 4.5l6 2 5.5-2v13l-5.5 2-6-2-5.5 2z" />
          <path d="M9 4.5v13M15 6.5v13" />
        </g>
      );
    case "heart":
      return (
        <path
          d="M12 19.5s-7.5-4.4-7.5-9.6A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 2.3c0 5.2-7.5 9.6-7.5 9.6z"
          {...STROKE}
        />
      );
    case "notebook-check":
      return (
        <g {...STROKE}>
          <rect x="5" y="3.5" width="14" height="17" rx="2" />
          <path d="m8.8 12.3 2.3 2.3 4.2-4.6" />
        </g>
      );
    case "compass":
      return (
        <g {...STROKE}>
          <circle cx="12" cy="12" r="8" />
          <path d="m14.8 9.2-1.6 4-4 1.6 1.6-4z" />
        </g>
      );
    case "map-pin":
      return (
        <g {...STROKE}>
          <path d="M12 20.5s6-5.5 6-10.5a6 6 0 0 0-12 0c0 5 6 10.5 6 10.5z" />
          <circle cx="12" cy="10" r="2.2" />
        </g>
      );
    case "notebook":
      return (
        <g {...STROKE}>
          <rect x="5" y="3.5" width="14" height="17" rx="2" />
          <path d="M8.5 8h7M8.5 11.5h7M8.5 15h4" />
        </g>
      );
    case "plane":
      return (
        <path
          d="M10.5 19.5 12 14l-5.5-1.5-2 2-1-.5 1.2-3L3.5 8l1-.5 2 2L12 8 10.5 2.5l1.5-.5 4 6.5 4-1a1.5 1.5 0 0 1 .8 2.9L16.8 11l-2.8 7.2z"
          {...STROKE}
        />
      );
    case "mountain":
      return (
        <g {...STROKE}>
          <path d="m3 19 6.5-10 3.5 5.4 2-3 6 7.6z" />
          <circle cx="17" cy="6.5" r="1.6" />
        </g>
      );
    case "pencil":
      return (
        <g {...STROKE}>
          <path d="M15.5 4.5 19.5 8.5 9 19H5v-4z" />
          <path d="m13.5 6.5 4 4" />
        </g>
      );
    case "sun":
      return (
        <g {...STROKE}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
        </g>
      );
    case "moon":
      return <path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10z" {...STROKE} />;
    case "theme-system":
      // 半圓：一半日一半夜＝跟隨系統
      return (
        <>
          <circle cx="12" cy="12" r="8" {...STROKE} />
          <path d="M12 4a8 8 0 0 0 0 16z" fill="currentColor" />
        </>
      );
    case "chat":
      return (
        <g {...STROKE}>
          <path d="M5.5 5h13A1.5 1.5 0 0 1 20 6.5v8a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 3.5V16A1.5 1.5 0 0 1 4 14.5v-8A1.5 1.5 0 0 1 5.5 5z" />
          <path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01" />
        </g>
      );
    case "star":
      // 實心：「聽完／推薦」是拿到的獎勵，填色比線條好認；顏色由 currentColor 決定
      return (
        <path
          d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"
          {...STROKE}
          fill="currentColor"
        />
      );
    case "palette":
      return (
        <g {...STROKE}>
          <path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.4 0 2-1 1.4-2.1-.6-1.2.1-2.4 1.5-2.4H17a3.5 3.5 0 0 0 3.5-3.5c0-5-3.8-9-8.5-9z" />
          <circle cx="7.8" cy="11" r="1" />
          <circle cx="10.5" cy="7.5" r="1" />
          <circle cx="15" cy="8" r="1" />
        </g>
      );
    case "shield-plus":
      return (
        <g {...STROKE}>
          <path d="M12 3.5 5 6v5.5c0 4.4 3 7.6 7 9 4-1.4 7-4.6 7-9V6z" />
          <path d="M12 9v6M9 12h6" />
        </g>
      );
    case "chevron-up":
      return (
        <g {...STROKE}>
          <path d="m6 14.5 6-6 6 6" />
        </g>
      );
    case "flag":
      return (
        <g {...STROKE}>
          <path d="M6 20.5V4.5" />
          <path d="M6 5h11l-2.5 4L17 13H6" />
        </g>
      );
    case "bar-chart":
      return (
        <g {...STROKE}>
          <path d="M4 20h16" />
          <path d="M7 16.5v-5M12 16.5V7M17 16.5v-8" />
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
