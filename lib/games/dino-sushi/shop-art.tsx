import { useId } from "react";
import type { PlateTone } from "./art";
import type { Sushi } from "./sushi";

/**
 * 《多多壽司屋》店面的小道具（黏土風 SVG，做法同 art.tsx）：紅燈籠、看得到遊樂園摩天輪的圓窗。
 * 店面其餘部分（雨棚、木招牌、迴轉帶、櫃台）是 CSS 漸層畫的，才能跟著舞台任意寬高伸縮。
 */

/** 紅色提燈：黑蓋、橫肋、白圓徽（一貫鮭魚握壽司）、金色流蘇。座標 40×66。 */
export function LanternArt() {
  return (
    <svg viewBox="0 0 40 66" width="100%" height="100%" aria-hidden focusable="false">
      <path d="M20 0v9" stroke="#6b4a2a" strokeWidth="1.6" />
      <rect x="11" y="8" width="18" height="5.5" rx="2" fill="#3a2f28" />
      <ellipse cx="20" cy="31" rx="17" ry="19" fill="#e9573f" stroke="#b63e2b" strokeWidth="1.8" />
      <g fill="none" stroke="#c4452f" strokeWidth="1.3" opacity="0.75">
        <path d="M5.2 21q14.8 4 29.6 0" />
        <path d="M3.4 27q16.6 4 33.2 0" />
        <path d="M3.2 34q16.8 4 33.6 0" />
        <path d="M4.8 41q15.2 4 30.4 0" />
      </g>
      <circle cx="20" cy="31" r="7.6" fill="#fff4e6" stroke="#f2c9b8" strokeWidth="1" />
      <ellipse cx="20" cy="33.6" rx="5" ry="2.2" fill="#fffdf6" stroke="#cdbfae" strokeWidth="0.8" />
      <path d="M15.2 31.6c1.6-2.8 7.2-3.6 9.8-1.2-1.4 1.8-7.6 2.6-9.8 1.2Z" fill="#ff8f5a" stroke="#e0663a" strokeWidth="0.8" />
      <ellipse cx="12.4" cy="24" rx="3" ry="7.4" fill="#fff" opacity="0.28" transform="rotate(14 12.4 24)" />
      <rect x="12.5" y="48.5" width="15" height="5" rx="2" fill="#3a2f28" />
      <path d="M17 53.5l-1.2 11M20 53.5v12M23 53.5l1.2 11" stroke="#f0b632" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** 和風圓窗（丸窓）：木框、兩根竹格，窗外是遊樂園的粉色天空和摩天輪（壽司屋開在車車遊樂園裡）。座標 100×100。 */
export function ShopWindowArt() {
  // 廚房與結算可能同時掛著店面：漸層與裁切的 id 要各自唯一
  const uid = useId();
  const sky = `${uid}-sky`;
  const view = `${uid}-view`;
  const gondolas = [0, 60, 120, 180, 240, 300].map((deg, i) => {
    const r = (deg * Math.PI) / 180;
    return { x: 62 + Math.cos(r) * 17, y: 52 + Math.sin(r) * 17, fill: ["#ff9fb7", "#8fd8f0", "#ffd34d"][i % 3]! };
  });
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden focusable="false">
      <defs>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd6e1" />
          <stop offset="1" stopColor="#fff0dc" />
        </linearGradient>
        <clipPath id={view}>
          <circle cx="50" cy="50" r="40" />
        </clipPath>
      </defs>
      <circle cx="50" cy="51.5" r="48" fill="#a8743c" opacity="0.35" />
      <circle cx="50" cy="50" r="48" fill="#c99158" />
      <circle cx="50" cy="50" r="44" fill="#e9c189" stroke="#b9824a" strokeWidth="1.5" />
      <g clipPath={`url(#${view})`}>
        <rect x="0" y="0" width="100" height="100" fill={`url(#${sky})`} />
        <g fill="#fff" opacity="0.95">
          <ellipse cx="28" cy="30" rx="12" ry="6" />
          <ellipse cx="36" cy="26" rx="8" ry="6" />
          <ellipse cx="78" cy="22" rx="8" ry="4" />
        </g>
        <path d="M54 82l8-30 8 30" fill="none" stroke="#c9a0e8" strokeWidth="3" strokeLinecap="round" />
        <circle cx="62" cy="52" r="17" fill="none" stroke="#f5a3bd" strokeWidth="2.6" />
        <g stroke="#f5a3bd" strokeWidth="1.4">
          {gondolas.map((g) => (
            <path key={`${g.x}-${g.y}`} d={`M62 52L${g.x} ${g.y}`} />
          ))}
        </g>
        {gondolas.map((g) => (
          <circle key={`g-${g.x}-${g.y}`} cx={g.x} cy={g.y} r="3.4" fill={g.fill} stroke="#fff" strokeWidth="1" />
        ))}
        <circle cx="62" cy="52" r="3.2" fill="#ffd34d" stroke="#e8a92a" strokeWidth="1" />
        <path d="M0 80c14-8 26-8 38-2s26 8 36 0 20-6 26-2v24H0Z" fill="#a9dc95" />
        <path d="M0 88c16-6 30-4 46 1s34 4 54-3v14H0Z" fill="#8fcf7b" />
      </g>
      <g stroke="#b9824a" strokeWidth="3.4" strokeLinecap="round">
        <path d="M37 10.5v79M63 10.5v79" />
      </g>
      <path d="M22 26a34 34 0 0 1 20-14" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

/** 迴轉帶上繞來繞去的裝飾盤（不是點餐，盤上的壽司刻意小、蓋著透明蓋子）。 */
export const BELT_PLATES: readonly { tone: PlateTone; sushi: Sushi }[] = [
  { tone: "pink", sushi: { base: "nigiri", toppings: ["salmon"] } },
  { tone: "mint", sushi: { base: "gunkan", toppings: ["corn"] } },
  { tone: "lavender", sushi: { base: "nigiri", toppings: ["tamago"] } },
  { tone: "pink", sushi: { base: "temaki", toppings: ["cucumber"] } },
  { tone: "mint", sushi: { base: "nigiri", toppings: ["shrimp"] } },
  { tone: "lavender", sushi: { base: "gunkan", toppings: ["floss"] } },
];
