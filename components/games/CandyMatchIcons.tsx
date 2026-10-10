/**
 * 消消樂補充圖示：ClayIcons 沒有的幾個（玩法、步數、結算條件、回地圖）。
 * 一律 currentColor、aria-hidden，顏色交給外層，文字留給 aria-label。
 */

type IconProps = { size?: number; className?: string };

const svgProps = (size: number, className?: string) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  className,
  "aria-hidden": true as const,
  focusable: "false" as const,
});

/** 輕鬆冒險：一片葉子，慢慢來。 */
export function IconLeaf({ size = 20, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M5 19c0-8.5 6-14 14.5-14.5C19 13 13.5 19 5 19z" fill="currentColor" />
      <path
        d="M5.5 18.5l8-8"
        fill="none"
        stroke="#fff"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.8"
      />
    </svg>
  );
}

/** 挑戰冒險與步數：兩個腳印。 */
export function IconFootprints({ size = 20, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <g fill="currentColor">
        <ellipse cx="8" cy="9" rx="2.7" ry="3.9" />
        <ellipse cx="16" cy="13.5" rx="2.7" ry="3.9" />
        <circle cx="8" cy="15.4" r="1.4" />
        <circle cx="16" cy="19.9" r="1.4" />
      </g>
    </svg>
  );
}

/** 回地圖：摺起來的地圖。 */
export function IconMapFold({ size = 24, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
        <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" />
        <path d="M9 4v14M15 6v14" />
      </g>
    </svg>
  );
}

/** 任務完成：打勾。 */
export function IconCheck({ size = 22, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path
        d="M5 12.5l4.5 4.5L19 7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 第一步示範的手指：白手、深色描邊，壓在棋子上也看得清楚。 */
export function IconPointingHand({ size = 32, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path
        d="M10 13V5.5a1.5 1.5 0 0 1 3 0V12M13 11.5a1.5 1.5 0 0 1 3 0V13M16 12.5a1.5 1.5 0 0 1 3 0V16a5 5 0 0 1-5 5h-1.5a5 5 0 0 1-4-2l-2.8-3.7a1.5 1.5 0 0 1 2.3-1.9L10 15"
        fill="#fff"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
