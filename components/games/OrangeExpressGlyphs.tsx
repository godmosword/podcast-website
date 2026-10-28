import type { WindowNotice } from "@/lib/games/orange-express/notice";
import { signCells } from "@/lib/games/orange-express/windshield";
import styles from "./orange-express.module.css";

/*
 * 小橘特快車的小圖示：前窗提示與標題難度卡。向量黏土的畫法：圓角、左上一抹高光、下緣一條暗帶。
 * 圖內不寫字。顏色跟前窗畫布同一組固定美術色（rgb 寫在這裡，不走 token）。
 */

const INK = "rgb(58, 46, 40)";
const SHINE = "rgb(255, 255, 255)";

/** 號角：細管接喇叭口，右邊三道聲音。駕駛台的紅色喇叭鈕與鐵橋提示用同一個，孩子才知道要按哪顆。 */
export function HornIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect x="1.5" y="9.75" width="3.5" height="4.5" rx="1.2" fill="currentColor" />
      <rect x="4.5" y="10.5" width="5.5" height="3" fill="currentColor" />
      <path d="M9.5 10.2C12.6 9.8 14.6 7.6 16.2 4.6V19.4C14.6 16.4 12.6 14.2 9.5 13.8Z" fill="currentColor" />
      <rect x="15.4" y="4.6" width="2.6" height="14.8" rx="1.3" fill="currentColor" />
      <path
        d="M20.2 8.6l1.8-1.4M20.6 12h2.2M20.2 15.4l1.8 1.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** 速限牌：紅圈白底、三個格子亮幾格，跟前窗畫的那面牌一樣。 */
export function SignGlyph({ bars }: { bars: 1 | 2 | 3 }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={styles.noticeGlyph}>
      <circle cx="16" cy="16" r="15" fill="rgb(232, 106, 74)" />
      <circle cx="16" cy="16" r="11" fill="rgb(255, 252, 244)" />
      {signCells(bars).map((cell, i) => (
        <rect
          key={i}
          x={16 + cell.x * 15}
          y={16 + cell.y * 15}
          width={cell.w * 15}
          height={cell.h * 15}
          rx="0.8"
          fill={cell.lit ? INK : "none"}
          stroke={INK}
          strokeWidth="1.3"
        />
      ))}
    </svg>
  );
}

/** 鐵橋：紅色喇叭鈕的縮小版（暖紅圓鈕＋白色號角）。 */
function HornBadge() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={styles.noticeGlyph}>
      <circle cx="16" cy="17" r="14" fill="rgb(176, 64, 40)" />
      <circle cx="16" cy="15.5" r="14" fill="rgb(214, 84, 52)" />
      <ellipse cx="10.5" cy="9" rx="5" ry="2.6" fill={SHINE} opacity="0.35" />
      <g transform="translate(6.5 6) scale(0.8)" color={SHINE}>
        <HornIcon />
      </g>
    </svg>
  );
}

/** 對向列車：迎面看的圓臉車頭，奶油車身、淡紫腰帶，跟前窗畫的那列一樣。 */
function OncomingGlyph() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={styles.noticeGlyph}>
      <rect x="5" y="4" width="22" height="25" rx="9" fill="rgb(160, 164, 170)" />
      <rect x="5" y="3" width="22" height="24" rx="9" fill="rgb(252, 248, 238)" />
      <rect x="9" y="7" width="14" height="7" rx="3.5" fill="rgb(70, 96, 120)" />
      <rect x="5" y="17" width="22" height="3.5" fill="rgb(176, 150, 220)" />
      <circle cx="10.5" cy="23" r="1.8" fill="rgb(255, 236, 160)" />
      <circle cx="21.5" cy="23" r="1.8" fill="rgb(255, 236, 160)" />
      <ellipse cx="10" cy="5.5" rx="3.5" ry="1.4" fill={SHINE} opacity="0.6" />
    </svg>
  );
}

/** 隧道：山丘上的拱形洞口，裡面暗、兩盞小燈。 */
function TunnelGlyph() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={styles.noticeGlyph}>
      <path d="M2 29C2 13 8 4 16 4s14 9 14 25z" fill="rgb(126, 176, 116)" />
      <path d="M2 27C2 12 8 3 16 3s14 9 14 24z" fill="rgb(150, 198, 140)" />
      <path d="M8 29V20a8 8 0 0 1 16 0v9z" fill="rgb(206, 196, 180)" />
      <path d="M10.5 29V20.5a5.5 5.5 0 0 1 11 0V29z" fill="rgb(46, 42, 56)" />
      <circle cx="13" cy="21" r="1.2" fill="rgb(255, 214, 130)" />
      <circle cx="19" cy="21" r="1.2" fill="rgb(255, 214, 130)" />
      <ellipse cx="11" cy="7.5" rx="4" ry="1.6" fill={SHINE} opacity="0.4" />
    </svg>
  );
}

/** 前窗提示前面那顆圖示：先看圖，字是給大人看的。 */
export function NoticeGlyph({ notice }: { notice: WindowNotice }) {
  if (notice.kind === "sign") return <SignGlyph bars={notice.bars ?? 1} />;
  if (notice.kind === "bridge" || notice.kind === "greeted") return <HornBadge />;
  if (notice.kind === "passing") return <OncomingGlyph />;
  return <TunnelGlyph />;
}
