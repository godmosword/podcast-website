import type { CSSProperties, ReactNode } from "react";
import type { Sushi } from "./sushi";
import type { BaseId, ToppingId } from "./toppings";

/**
 * 《多多壽司屋》食材、壽司、盤子的黏土風 SVG（做法同消消樂 PieceArt：平塗＋深色描邊＋左上高光）。
 * 同色系的料靠形狀區分：玉子方塊／玉米粒堆、蝦彎／鮭魚條紋片／蟹肉棒圓柱、小黃瓜圓片／酪梨月牙。
 */

type ArtProps = { size?: number | string; style?: CSSProperties };

function Svg({ size = "100%", style, viewBox = "0 0 48 48", children }: ArtProps & { viewBox?: string; children: ReactNode }) {
  return (
    <svg viewBox={viewBox} width={size} height={size} style={style} aria-hidden focusable="false">
      {children}
    </svg>
  );
}

const Shine = ({ cx, cy, rx = 4, ry = 1.8 }: { cx: number; cy: number; rx?: number; ry?: number }) => (
  <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#fff" opacity="0.55" />
);

/** 料的本體（不含 <svg>），座標系 48×48，讓托盤圖示與壽司上的料共用同一張圖。 */
function ToppingShape({ id }: { id: ToppingId }) {
  switch (id) {
    case "tamago":
      return (
        <g>
          <rect x="8" y="14" width="32" height="22" rx="5" fill="#ffd34d" stroke="#d9a514" strokeWidth="2" />
          <path d="M9 21h30M9 28h30" stroke="#e8b52a" strokeWidth="1.6" opacity="0.7" />
          <rect x="20" y="13" width="8" height="24" rx="2" fill="#2f4a3a" />
          <Shine cx={14} cy={17.5} />
        </g>
      );
    case "shrimp":
      return (
        <g>
          <path d="M33 36c-4 4-12 5-18 1-7-5-7-15-1-20 4-4 11-5 16-2l-4 6c-3-1-6-1-8 1-3 3-2 8 2 10 3 2 7 1 9-1Z" fill="#ffe3dc" stroke="#e0705a" strokeWidth="2" strokeLinejoin="round" />
          <path d="M12 22.5l6 3M11 30l6.5-1M17 37l3.5-5" stroke="#ff6a4a" strokeWidth="3" strokeLinecap="round" />
          <path d="M30 14c3-6 9-8 12-5-1 3-4 5-7 6 3 1 6 4 5 7-4 1-8-2-10-6Z" fill="#ff6a4a" stroke="#d94a3c" strokeWidth="1.8" strokeLinejoin="round" />
          <Shine cx={15} cy={21} rx={2.4} ry={1.3} />
        </g>
      );
    case "crab":
      return (
        <g>
          <rect x="7" y="17" width="34" height="15" rx="7.5" fill="#fff6ef" stroke="#b39a86" strokeWidth="2" />
          <path d="M7.5 24.5a7.5 7.5 0 0 1 7.5-7.5h18a7.5 7.5 0 0 1 7.5 7.5Z" fill="#ff5c5c" />
          <path d="M14 18v6M20 17.5v7M26 17.5v7M32 18v6" stroke="#e03c3c" strokeWidth="1.4" opacity="0.8" />
          <ellipse cx="41" cy="24.5" rx="2.6" ry="7.2" fill="#fff6ef" stroke="#b39a86" strokeWidth="1.6" />
          <Shine cx={14} cy={20} rx={3} ry={1.3} />
        </g>
      );
    case "corn":
      return (
        <g stroke="#d9a514" strokeWidth="1.4">
          {[
            [16, 30], [24, 31], [32, 30], [12, 23], [20, 23], [28, 23], [36, 23], [16, 16], [24, 15], [32, 16],
          ].map(([cx, cy]) => (
            <rect key={`${cx}-${cy}`} x={cx - 4.2} y={cy - 4.2} width="8.4" height="8.4" rx="2.6" fill="#ffe066" />
          ))}
          <circle cx="15" cy="15" r="1.4" fill="#fff" stroke="none" opacity="0.7" />
        </g>
      );
    case "cucumber":
      return (
        <g>
          <circle cx="18" cy="26" r="11" fill="#5cb85c" />
          <circle cx="18" cy="26" r="8.4" fill="#d9f5c8" />
          <circle cx="31" cy="21" r="11" fill="#5cb85c" />
          <circle cx="31" cy="21" r="8.4" fill="#d9f5c8" />
          {[[31, 17], [28, 22], [34, 22], [31, 25]].map(([cx, cy]) => (
            <ellipse key={`${cx}-${cy}`} cx={cx} cy={cy} rx="1" ry="1.6" fill="#9fcf7f" />
          ))}
          <circle cx="31" cy="21" r="11" fill="none" stroke="#3f8f3f" strokeWidth="1.8" />
        </g>
      );
    case "tuna":
      return (
        <g>
          <path d="M8 33c0-9 7-17 16-17s16 8 16 17c0 2-2 3-4 3H12c-2 0-4-1-4-3Z" fill="#f7c9b0" stroke="#c98a6a" strokeWidth="2" />
          {[[16, 26], [24, 22], [31, 28], [21, 31], [28, 33], [34, 32]].map(([cx, cy], i) => (
            <path key={`${cx}-${cy}`} d={`M${cx - 2} ${cy}q2-${i % 2 ? 2.4 : 1.6} 4 0`} stroke="#ef8a8a" strokeWidth="2" strokeLinecap="round" fill="none" />
          ))}
          <path d="M17 20c2-1 4-1.5 6-1.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        </g>
      );
    case "floss":
      return (
        <g fill="none" strokeLinecap="round">
          <path d="M7 34c-2-6 3-9 6-8 0-5 5-8 9-6 2-4 8-4 10 0 4-2 9 1 8 6 4 1 4 7 1 8Z" fill="#e8b878" stroke="#b97a3a" strokeWidth="2" strokeLinejoin="round" />
          <path d="M9 31c3-6 6 3 9-3s6 4 9-2 6 3 9-3 4 3 5 1" stroke="#b97a3a" strokeWidth="3.2" />
          <path d="M11 24c3-5 6 3 9-3s6 4 9-2 6 3 8-1" stroke="#d99a55" strokeWidth="3.2" />
          <path d="M14 18c3-4 5 2 8-2s5 3 8-1" stroke="#f5d29a" strokeWidth="2.6" />
        </g>
      );
    case "salmon":
      return (
        <g>
          <path d="M6 30c4-10 14-16 30-15 5 0 7 3 5 7-4 9-15 15-29 14-5 0-8-2-6-6Z" fill="#ff8f5a" stroke="#e0663a" strokeWidth="2" strokeLinejoin="round" />
          <path d="M16 20c-1 5 0 10 2 15M24 17c-1 6 0 12 2 17M32 15.5c-1 6 0 11 1.5 15" stroke="#fff3e8" strokeWidth="2" strokeLinecap="round" />
          <Shine cx={14} cy={25} rx={2.6} ry={1.2} />
        </g>
      );
    case "avocado":
      return (
        <g>
          <path d="M8 30c6-12 20-17 32-12-4 12-18 19-32 12Z" fill="#e3f0a0" stroke="#b9cf6a" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M40 18c-4 12-18 19-32 12" fill="none" stroke="#3f6f2a" strokeWidth="3.4" strokeLinecap="round" />
          <path d="M12 36c6-10 18-14 28-10-4 9-16 15-28 10Z" fill="#d6ea8a" stroke="#b9cf6a" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M40 26c-4 9-16 15-28 10" fill="none" stroke="#3f6f2a" strokeWidth="3.4" strokeLinecap="round" />
        </g>
      );
    case "strawberry":
      return (
        <g>
          <path d="M24 40c-9-5-14-13-12-20 1-4 6-5 12-3 6-2 11-1 12 3 2 7-3 15-12 20Z" fill="#ff5c7a" stroke="#d93a5a" strokeWidth="2" strokeLinejoin="round" />
          <path d="M17 15l4 3 3-6 3 6 4-3-1 5H18Z" fill="#5cb85c" stroke="#3f8f3f" strokeWidth="1.6" strokeLinejoin="round" />
          {[[19, 25], [25, 23], [30, 26], [22, 31], [28, 31], [25, 36]].map(([cx, cy]) => (
            <ellipse key={`${cx}-${cy}`} cx={cx} cy={cy} rx="0.9" ry="1.4" fill="#ffe8a8" />
          ))}
          <Shine cx={18} cy={21} rx={2.2} ry={1.3} />
        </g>
      );
    case "pudding":
      return (
        <g>
          <path d="M14 18h20l4 18H10Z" fill="#ffe08a" stroke="#d9a514" strokeWidth="2" strokeLinejoin="round" />
          <path d="M14 18h20l1.2 5c-3 2-5-1-7 1s-5 0-7 1-5-1-7.6 0Z" fill="#a8622e" stroke="#7a4420" strokeWidth="1.6" strokeLinejoin="round" />
          <ellipse cx="24" cy="38" rx="17" ry="3.2" fill="#fff" stroke="#d6cfc6" strokeWidth="1.6" />
          <circle cx="24" cy="14" r="3" fill="#ff5c7a" stroke="#d93a5a" strokeWidth="1.4" />
          <Shine cx={16} cy={28} rx={1.6} ry={3} />
        </g>
      );
    case "wasabi":
      return (
        <g>
          <path d="M24 9c5 8 13 14 13 21a13 13 0 0 1-26 0c0-7 8-13 13-21Z" fill="#9fd67a" stroke="#5f9f3f" strokeWidth="2.2" strokeLinejoin="round" />
          <ellipse cx="19" cy="27" rx="3" ry="5" fill="#d5f0bf" transform="rotate(20 19 27)" />
        </g>
      );
  }
}

/** 托盤／料位用的單一料圖示。 */
export function ToppingArt({ id, size, style }: ArtProps & { id: ToppingId }) {
  return (
    <Svg size={size} style={style}>
      <ToppingShape id={id} />
    </Svg>
  );
}

/** 飯型本體（座標系 96×72，底部中央 48,62 接盤子）。 */
function BaseShape({ id }: { id: BaseId }) {
  switch (id) {
    case "nigiri":
      return (
        <g>
          <path d="M14 56c-4-12 6-20 34-20s38 8 34 20c-2 5-14 7-34 7s-32-2-34-7Z" fill="#fffdf6" stroke="#b8ab9a" strokeWidth="2.2" />
          {[[26, 48], [38, 44], [52, 46], [64, 49], [34, 54], [58, 55], [46, 52]].map(([cx, cy]) => (
            <ellipse key={`${cx}-${cy}`} cx={cx} cy={cy} rx="2.2" ry="1.3" fill="#ece5da" />
          ))}
          <Shine cx={30} cy={41} rx={7} ry={2.2} />
        </g>
      );
    case "gunkan":
      return (
        <g>
          <rect x="18" y="30" width="60" height="32" rx="9" fill="#2f4a3a" stroke="#1f3328" strokeWidth="2.2" />
          <path d="M22 38h52M22 50h52" stroke="#3f5f4a" strokeWidth="1.6" opacity="0.8" />
          <ellipse cx="48" cy="31" rx="29" ry="7" fill="#fffdf6" stroke="#b8ab9a" strokeWidth="2" />
          <Shine cx={30} cy={36} rx={5} ry={1.6} />
        </g>
      );
    case "temaki":
      return (
        <g>
          <path d="M18 30l30 34 30-34Z" fill="#2f4a3a" stroke="#1f3328" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M30 44l18 20 18-20" stroke="#3f5f4a" strokeWidth="1.6" fill="none" opacity="0.8" />
          <ellipse cx="48" cy="30" rx="31" ry="8" fill="#fffdf6" stroke="#b8ab9a" strokeWidth="2" />
          <Shine cx={30} cy={34} rx={5} ry={1.6} />
        </g>
      );
  }
}

/** 飯型選擇鈕用。 */
export function BaseArt({ id, size, style }: ArtProps & { id: BaseId }) {
  return (
    <Svg size={size} style={style} viewBox="0 0 96 72">
      <BaseShape id={id} />
    </Svg>
  );
}

/** 料放在飯上的位置（96×72 座標，依層數）。 */
const LAYER_SPOTS: Record<number, readonly (readonly [number, number])[]> = {
  1: [[48, 30]],
  2: [[34, 32], [62, 32]],
  3: [[22, 36], [48, 24], [74, 36]],
};
/** 層數越多，每顆料越小，才不會互相蓋掉一半。 */
const LAYER_SIZES: Record<number, number> = { 1: 46, 2: 40, 3: 34 };

/** 砧板上／盤子上的完整壽司。沒選飯時什麼都不畫。 */
export function SushiArt({ sushi, size, style }: ArtProps & { sushi: Sushi }) {
  if (!sushi.base) return null;
  const spots = LAYER_SPOTS[sushi.toppings.length] ?? [];
  return (
    <Svg size={size} style={style} viewBox="0 0 96 72">
      <BaseShape id={sushi.base} />
      {sushi.toppings
        .map((id, i) => ({ id, i, spot: spots[i]! }))
        // 後排（y 小）先畫，前排蓋在上面
        .sort((a, b) => a.spot[1] - b.spot[1])
        .map(({ id, i, spot: [cx, cy] }) => {
          const size = LAYER_SIZES[sushi.toppings.length] ?? 34;
          return (
            <g key={`${id}-${i}`} transform={`translate(${cx - size / 2} ${cy - size / 2}) scale(${size / 48})`}>
              <ToppingShape id={id} />
            </g>
          );
        })}
    </Svg>
  );
}

/** 迴轉壽司盤；gold＝一次做對的金邊盤。 */
export function PlateArt({ gold = false, size, style }: ArtProps & { gold?: boolean }) {
  return (
    <Svg size={size} style={style} viewBox="0 0 96 32">
      <ellipse cx="48" cy="18" rx="44" ry="12" fill={gold ? "#ffd34d" : "#8ddff0"} stroke={gold ? "#d9a514" : "#5bb7d6"} strokeWidth="2.2" />
      <ellipse cx="48" cy="16" rx="34" ry="8" fill="#fffdf6" stroke={gold ? "#e8b52a" : "#bfe9f5"} strokeWidth="1.6" />
      <Shine cx={28} cy={13} rx={8} ry={1.8} />
    </Svg>
  );
}
