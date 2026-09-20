import type { CSSProperties, ReactNode } from "react";

/**
 * 繽紛方塊用的手繪風 SVG icon set。
 * 取代 emoji：跨平台長相一致，可精準對齊馬卡龍配色。
 * 預設吃 currentColor，彩色款（星星、火焰、彩虹…）內建糖果色。
 */

type IconProps = {
  size?: number;
  color?: string;
  style?: CSSProperties;
};

function Svg({
  size = 16,
  style,
  children,
}: {
  size?: number;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={{ display: "inline-block", verticalAlign: "-0.18em", flexShrink: 0, ...style }}
    >
      {children}
    </svg>
  );
}

const stroke = (color: string) => ({
  stroke: color,
  strokeWidth: 2.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

/** 暫存箱（HOLD） */
export function IconBox({ size, color = "currentColor", style }: IconProps) {
  return (
    <Svg size={size} style={style}>
      <rect x="4" y="8" width="16" height="12" rx="3" {...stroke(color)} />
      <path d="M4 12.5h16" {...stroke(color)} />
      <path d="M9.5 8V6.5a2.5 2.5 0 0 1 5 0V8" {...stroke(color)} />
    </Svg>
  );
}

/** 下一個（雙箭頭向下） */
export function IconNext({ size, color = "currentColor", style }: IconProps) {
  return (
    <Svg size={size} style={style}>
      <path d="M7 5.5l5 5 5-5" {...stroke(color)} />
      <path d="M7 13l5 5 5-5" {...stroke(color)} />
    </Svg>
  );
}

/** 獎盃（最佳分數／新紀錄） */
export function IconTrophy({ size, color = "#f5b73c", style }: IconProps) {
  return (
    <Svg size={size} style={style}>
      <path d="M8 4h8v6a4 4 0 0 1-8 0V4Z" fill={color} {...stroke(color)} />
      <path d="M8 5.5H4.8v1A3.2 3.2 0 0 0 8 9.7M16 5.5h3.2v1A3.2 3.2 0 0 1 16 9.7" {...stroke(color)} />
      <path d="M12 14v3.5M8.5 20h7" {...stroke(color)} />
    </Svg>
  );
}

/** 火焰（連擊／挑戰難度） */
export function IconFlame({ size, color = "#ff8a5c", style }: IconProps) {
  return (
    <Svg size={size} style={style}>
      <path
        d="M12 3c1.2 3.2 5 4.8 5 9a5 5 0 0 1-10 0c0-2 .9-3.5 2-4.6.1 1.4.7 2.3 1.6 2.8C10.2 7.8 10.9 5.1 12 3Z"
        fill={color}
        {...stroke(color)}
      />
      <path d="M12 18.5a2.4 2.4 0 0 1-2.4-2.4c0-1.4 1.3-2.1 2.4-3.6 1.1 1.5 2.4 2.2 2.4 3.6A2.4 2.4 0 0 1 12 18.5Z" fill="#ffe9b8" />
    </Svg>
  );
}

/** 新芽（輕鬆難度） */
export function IconSprout({ size, color = "#5fbf85", style }: IconProps) {
  return (
    <Svg size={size} style={style}>
      <path d="M12 21v-7.5" {...stroke(color)} />
      <path d="M12 13.5C12 9.5 9 7.5 5 7.5c0 4 3 6 7 6Z" fill="#a6e7c0" {...stroke(color)} />
      <path d="M12 11.5c0-3.5 2.6-5.5 6.2-5.5 0 3.5-2.6 5.5-6.2 5.5Z" fill="#cdf3dd" {...stroke(color)} />
    </Svg>
  );
}

/** 星星（標準難度／分數／升級） */
export function IconStar({ size, color = "#ffd34d", style }: IconProps) {
  return (
    <Svg size={size} style={style}>
      <path
        d="M12 3.2l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.8L12 3.2Z"
        fill={color}
        {...stroke("#f0b429")}
        strokeWidth={1.8}
      />
    </Svg>
  );
}

/** 彩虹（特殊模式徽章） */
export function IconRainbow({ size, style }: IconProps) {
  return (
    <Svg size={size} style={style}>
      <path d="M3.5 17a8.5 8.5 0 0 1 17 0" {...stroke("#ff9fb7")} />
      <path d="M6.8 17a5.2 5.2 0 0 1 10.4 0" {...stroke("#ffd34d")} />
      <path d="M10 17a2 2 0 0 1 4 0" {...stroke("#7fd4a8")} />
    </Svg>
  );
}

/** 旋轉（圓角方塊 + 弧形箭頭，明確表示轉向） */
export function IconRotate({ size, color = "currentColor", style }: IconProps) {
  return (
    <Svg size={size} style={style}>
      <rect x="7.5" y="9" width="9" height="9" rx="2.2" {...stroke(color)} />
      <path d="M17.2 6.8h3v3" {...stroke(color)} />
      <path d="M17.2 6.8a7.2 7.2 0 1 0 2.2 5.6" {...stroke(color)} />
    </Svg>
  );
}

/** 左移 */
export function IconChevronLeft({ size, color = "currentColor", style }: IconProps) {
  return (
    <Svg size={size} style={style}>
      <path d="M14.5 6.5 8.5 12l6 5.5" {...stroke(color)} />
    </Svg>
  );
}

/** 右移 */
export function IconChevronRight({ size, color = "currentColor", style }: IconProps) {
  return (
    <Svg size={size} style={style}>
      <path d="M9.5 6.5 15.5 12l-6 5.5" {...stroke(color)} />
    </Svg>
  );
}

/** 下滑 */
export function IconSwipeDown({ size, color = "currentColor", style }: IconProps) {
  return (
    <Svg size={size} style={style}>
      <path d="M12 4.5v14" {...stroke(color)} />
      <path d="M6.5 13l5.5 5.5L17.5 13" {...stroke(color)} />
    </Svg>
  );
}

/** 上滑 */
export function IconSwipeUp({ size, color = "currentColor", style }: IconProps) {
  return (
    <Svg size={size} style={style}>
      <path d="M12 19.5v-14" {...stroke(color)} />
      <path d="M6.5 11L12 5.5 17.5 11" {...stroke(color)} />
    </Svg>
  );
}

/** 空白鍵 */
export function IconSpaceKey({ size, color = "currentColor", style }: IconProps) {
  return (
    <Svg size={size} style={style}>
      <path d="M5 10.5v3.5a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 14v-3.5" {...stroke(color)} />
    </Svg>
  );
}

/** 再玩一次（循環箭頭） */
export function IconReplay({ size, color = "currentColor", style }: IconProps) {
  return (
    <Svg size={size} style={style}>
      <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" {...stroke(color)} />
      <path d="M19.8 3.6v4.6h-4.6" {...stroke(color)} />
    </Svg>
  );
}

/** 播放 */
export function IconPlay({ size, color = "currentColor", style }: IconProps) {
  return (
    <Svg size={size} style={style}>
      <path d="M8.2 5.4v13.2a.8.8 0 0 0 1.2.7l10.2-6.6a.8.8 0 0 0 0-1.4L9.4 4.7a.8.8 0 0 0-1.2.7Z" fill={color} {...stroke(color)} strokeWidth={1.6} />
    </Svg>
  );
}

/** 暫停 */
export function IconPauseGlyph({ size, color = "currentColor", style }: IconProps) {
  return (
    <Svg size={size} style={style}>
      <rect x="6.5" y="5" width="3.6" height="14" rx="1.8" fill={color} />
      <rect x="13.9" y="5" width="3.6" height="14" rx="1.8" fill={color} />
    </Svg>
  );
}

/** 糖果（待機畫面主視覺） */
export function IconCandy({ size, style }: IconProps) {
  return (
    <Svg size={size} style={style}>
      <path d="M17 9.5 21 7l-1.3 5L21 17l-4-2.5" fill="#ffd1df" {...stroke("#ff9fb7")} strokeWidth={1.8} />
      <path d="M7 9.5 3 7l1.3 5L3 17l4-2.5" fill="#ffd1df" {...stroke("#ff9fb7")} strokeWidth={1.8} />
      <circle cx="12" cy="12" r="4.6" fill="#ffb4cf" {...stroke("#ff9fb7")} strokeWidth={1.8} />
      <path d="M9.6 10.2c1.6 1 3.2 1 4.8 0M9.6 13.8c1.6 1 3.2 1 4.8 0" {...stroke("#fff")} strokeWidth={1.6} />
    </Svg>
  );
}

/** 亮晶晶（結束畫面主視覺） */
export function IconSparkle({ size, color = "#ffd34d", style }: IconProps) {
  return (
    <Svg size={size} style={style}>
      <path d="M12 3l1.9 6.1L20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-1.9L12 3Z" fill={color} {...stroke("#f0b429")} strokeWidth={1.6} />
      <circle cx="19" cy="5" r="1.6" fill="#bde7ff" />
      <circle cx="5" cy="18.5" r="1.3" fill="#ffb4cf" />
    </Svg>
  );
}

/** 小朋友（兒童模式） */
export function IconKid({ size, color = "#5d4a67", style }: IconProps) {
  return (
    <Svg size={size} style={style}>
      <circle cx="12" cy="13" r="7.5" fill="#ffe3d0" {...stroke(color)} strokeWidth={1.8} />
      <circle cx="9.4" cy="12.4" r="1" fill={color} />
      <circle cx="14.6" cy="12.4" r="1" fill={color} />
      <path d="M9.6 15.6c1.5 1.2 3.3 1.2 4.8 0" {...stroke(color)} strokeWidth={1.8} />
      <path d="M12 5.5c-.4-1.6.8-2.6 2-2.4" {...stroke(color)} strokeWidth={1.8} />
    </Svg>
  );
}

/** 泡泡（消消樂道具） */
export function IconBubble({ size, style }: IconProps) {
  return (
    <Svg size={size} style={style}>
      <circle cx="10.5" cy="12.5" r="6.5" fill="#dff4ff" {...stroke("#7cc7ee")} strokeWidth={1.8} />
      <path d="M7.4 10.6a3.6 3.6 0 0 1 2.6-2.4" {...stroke("#ffffff")} strokeWidth={1.8} />
      <circle cx="18" cy="7" r="2.6" fill="#dff4ff" {...stroke("#7cc7ee")} strokeWidth={1.6} />
      <circle cx="18.5" cy="16.5" r="1.6" fill="#dff4ff" {...stroke("#7cc7ee")} strokeWidth={1.4} />
    </Svg>
  );
}

/** 掃把（消消樂道具：掃整排） */
export function IconBroom({ size, style }: IconProps) {
  return (
    <Svg size={size} style={style}>
      <path d="M15.5 3.5l-6 8" {...stroke("#b98a5c")} />
      <path d="M11 9.5l4 3-3.2 6.2a2 2 0 0 1-2.9.8l-4-3a2 2 0 0 1-.5-2.9L8 9.4l3 .1Z" fill="#ffd34d" {...stroke("#e0a93a")} strokeWidth={1.8} />
      <path d="M7.5 15.5l2.6 2M9.6 13.6l2.6 2" {...stroke("#e0a93a")} strokeWidth={1.4} />
    </Svg>
  );
}

/** 燈泡（提示／教學） */
export function IconBulb({ size, style }: IconProps) {
  return (
    <Svg size={size} style={style}>
      <path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3Z" fill="#ffe889" {...stroke("#e0a93a")} strokeWidth={1.8} />
      <path d="M10 19h4M10.5 21h3" {...stroke("#8a6d60")} strokeWidth={1.8} />
      <path d="M10.2 8.6a2.3 2.3 0 0 1 1.6-1.4" {...stroke("#ffffff")} strokeWidth={1.6} />
    </Svg>
  );
}

/** 鎖頭（未解鎖關卡） */
export function IconLock({ size, color = "#b9a9c6", style }: IconProps) {
  return (
    <Svg size={size} style={style}>
      <rect x="5" y="10.5" width="14" height="10" rx="3" fill="#efe9f5" {...stroke(color)} strokeWidth={1.8} />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" {...stroke(color)} strokeWidth={1.8} />
      <circle cx="12" cy="15.5" r="1.4" fill={color} />
    </Svg>
  );
}

/** 彩帶／紙花（過關） */
export function IconConfetti({ size, style }: IconProps) {
  return (
    <Svg size={size} style={style}>
      <path d="M4.5 19.5l4-11 7 7-11 4Z" fill="#ffd34d" {...stroke("#e0a93a")} strokeWidth={1.6} />
      <path d="M7.2 14.8l2.2 2.2" {...stroke("#fff3c2")} strokeWidth={1.4} />
      <circle cx="15.5" cy="6" r="1.6" fill="#ff9fb7" />
      <circle cx="19.5" cy="11" r="1.4" fill="#7fd4a8" />
      <path d="M13 9.5c1.5-1.5 3.5-1.5 4.5-3" {...stroke("#8ddff0")} strokeWidth={1.6} />
      <path d="M17.5 15.5l1.5 1.5" {...stroke("#c9b4ff")} strokeWidth={1.8} />
    </Svg>
  );
}

/** 加油（再試一次） */
export function IconCheer({ size, style }: IconProps) {
  return (
    <Svg size={size} style={style}>
      <path d="M12 20s-6.5-4.2-6.5-9A3.7 3.7 0 0 1 12 8.6 3.7 3.7 0 0 1 18.5 11c0 4.8-6.5 9-6.5 9Z" fill="#ffb4cf" {...stroke("#e87aa0")} strokeWidth={1.8} />
      <path d="M8.6 10.6c.3-.9 1-1.4 1.8-1.6" {...stroke("#ffffff")} strokeWidth={1.6} />
      <path d="M12 3.5v2M6.2 5.8l1.4 1.4M17.8 5.8l-1.4 1.4" {...stroke("#f0b429")} strokeWidth={1.8} />
    </Svg>
  );
}

/** 點一下（手指＋漣漪；操作提示用） */
export function IconTap({ size, color = "currentColor", style }: IconProps) {
  return (
    <Svg size={size} style={style}>
      <circle cx="12" cy="11" r="6.5" {...stroke(color)} strokeWidth={1.6} strokeDasharray="3 3" />
      <path d="M12 8v6.5" {...stroke(color)} />
      <path d="M12 14.5c0 2 1.2 3.5 3 4.5H9c1.8-1 3-2.5 3-4.5Z" fill={color} {...stroke(color)} strokeWidth={1.4} />
    </Svg>
  );
}

/** 拖曳／滑動（手指＋橫向箭頭；操作提示用） */
export function IconSwipe({ size, color = "currentColor", style }: IconProps) {
  return (
    <Svg size={size} style={style}>
      <path d="M4 9.5h16" {...stroke(color)} />
      <path d="M17 6.5l3 3-3 3M7 6.5l-3 3 3 3" {...stroke(color)} />
      <path d="M12 12v3.5c0 1.8 1.1 3.2 2.8 4H9.2c1.7-.8 2.8-2.2 2.8-4V12Z" fill={color} {...stroke(color)} strokeWidth={1.4} />
    </Svg>
  );
}

/** 蠟筆（著色站玩法） */
export function IconCrayon({ size, style }: IconProps) {
  return (
    <Svg size={size} style={style}>
      <path d="M6.5 15.5 15.2 6.8a2.3 2.3 0 0 1 3.3 0l.7.7a2.3 2.3 0 0 1 0 3.3L10.5 19.5H6.5v-4Z" fill="#ff9fb7" {...stroke("#d95f87")} strokeWidth={1.8} />
      <path d="M13.5 8.5l3 3" {...stroke("#d95f87")} strokeWidth={1.6} />
      <path d="M6.5 15.5l4 4" {...stroke("#d95f87")} strokeWidth={1.6} />
      <path d="M3.5 20.5h5" {...stroke("#8ddff0")} strokeWidth={2.2} />
    </Svg>
  );
}

/** 交換（消消樂站玩法：兩格互換） */
export function IconSwap({ size, color = "currentColor", style }: IconProps) {
  return (
    <Svg size={size} style={style}>
      <rect x="3" y="8" width="7" height="7" rx="2" fill="#ffd34d" {...stroke("#e0a93a")} strokeWidth={1.6} />
      <rect x="14" y="8" width="7" height="7" rx="2" fill="#8ddff0" {...stroke("#5bb7d6")} strokeWidth={1.6} />
      <path d="M8.5 5.5c2.5-2 4.5-2 7 0" {...stroke(color)} strokeWidth={2} />
      <path d="M14.2 4.2l1.6 1.4-1.6 1.4" {...stroke(color)} strokeWidth={2} />
      <path d="M15.5 18.5c-2.5 2-4.5 2-7 0" {...stroke(color)} strokeWidth={2} />
      <path d="M9.8 19.8l-1.6-1.4 1.6-1.4" {...stroke(color)} strokeWidth={2} />
    </Svg>
  );
}

/** 方塊落下（方塊站玩法） */
export function IconBlockFall({ size, color = "currentColor", style }: IconProps) {
  return (
    <Svg size={size} style={style}>
      <rect x="9" y="3" width="6" height="6" rx="1.6" fill="#c9b4ff" {...stroke("#9b84d6")} strokeWidth={1.6} />
      <path d="M12 10.5v4" {...stroke(color)} strokeWidth={2} />
      <path d="M9.6 12.6 12 15l2.4-2.4" {...stroke(color)} strokeWidth={2} />
      <rect x="3" y="16" width="6" height="5" rx="1.4" fill="#ffb4cf" {...stroke("#e87aa0")} strokeWidth={1.4} />
      <rect x="15" y="16" width="6" height="5" rx="1.4" fill="#b9f3db" {...stroke("#6fc8a3")} strokeWidth={1.4} />
    </Svg>
  );
}

/** 翻頁（著色「換一張」） */
export function IconPageTurn({ size, color = "currentColor", style }: IconProps) {
  return (
    <Svg size={size} style={style}>
      <path d="M5 4.5h9l5 5v10H5v-15Z" {...stroke(color)} strokeWidth={2} />
      <path d="M14 4.5v5h5" {...stroke(color)} strokeWidth={2} />
      <path d="M8.5 14.5h7M8.5 11h3" {...stroke(color)} strokeWidth={1.8} />
    </Svg>
  );
}

/** 往前（下一關／前進） */
export function IconArrowRight({ size, color = "currentColor", style }: IconProps) {
  return (
    <Svg size={size} style={style}>
      <path d="M4.5 12h14" {...stroke(color)} strokeWidth={2.6} />
      <path d="M12.5 6l6 6-6 6" {...stroke(color)} strokeWidth={2.6} />
    </Svg>
  );
}
