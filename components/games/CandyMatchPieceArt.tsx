import type { CSSProperties } from "react";

/**
 * 《繽紛消消樂》圖案：5 隻車車角色的黏土風正面車臉 SVG。
 * 重點是 3 歲也能辨識——每隻顏色＋頭頂輪廓都不同（尾翼/車頂燈/高窗/掃把/恐龍角）。
 */

type ArtProps = {
  size?: number | string;
  style?: CSSProperties;
};

function FaceBase({
  body,
  bodyDark,
  children,
}: {
  body: string;
  bodyDark: string;
  children?: React.ReactNode;
}) {
  return (
    <>
      {/* 車身（圓潤方塊）＋車窗臉 */}
      <rect x="6" y="14" width="36" height="26" rx="9" fill={body} stroke={bodyDark} strokeWidth="2" />
      <rect x="11" y="18" width="26" height="13" rx="6.5" fill="#fff" opacity="0.92" />
      {/* 眼睛＋微笑 */}
      <circle cx="18.5" cy="24" r="2.1" fill="#4a3a52" />
      <circle cx="29.5" cy="24" r="2.1" fill="#4a3a52" />
      <path d="M20 28.2c2.6 2 5.4 2 8 0" stroke="#4a3a52" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* 輪子 */}
      <circle cx="14" cy="40" r="4.6" fill="#4a3a52" />
      <circle cx="34" cy="40" r="4.6" fill="#4a3a52" />
      <circle cx="14" cy="40" r="1.9" fill="#fff" opacity="0.85" />
      <circle cx="34" cy="40" r="1.9" fill="#fff" opacity="0.85" />
      {/* 腮紅 */}
      <circle cx="13.5" cy="29" r="2" fill="#ff9fb7" opacity="0.55" />
      <circle cx="34.5" cy="29" r="2" fill="#ff9fb7" opacity="0.55" />
      {children}
    </>
  );
}

function Svg({ size = "100%", style, children }: ArtProps & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} style={style} aria-hidden focusable="false">
      {children}
    </svg>
  );
}

/** 小紅賽車（莓紅，頭頂賽車尾翼） */
export function PieceXiaoHong(props: ArtProps) {
  return (
    <Svg {...props}>
      <path d="M14 14l3-6h14l3 6" fill="#ff5c86" stroke="#e04568" strokeWidth="2" strokeLinejoin="round" />
      <rect x="20" y="5" width="8" height="4" rx="2" fill="#ffd1df" stroke="#e04568" strokeWidth="1.5" />
      <FaceBase body="#ff7a9c" bodyDark="#e04568" />
    </Svg>
  );
}

/** 黃色計程車（檸檬黃，車頂 TAXI 燈） */
export function PieceTaxi(props: ArtProps) {
  return (
    <Svg {...props}>
      <rect x="17" y="7" width="14" height="7" rx="3.5" fill="#fff" stroke="#d9a514" strokeWidth="2" />
      <circle cx="24" cy="10.5" r="1.8" fill="#ffd34d" />
      <FaceBase body="#ffd34d" bodyDark="#d9a514" />
    </Svg>
  );
}

/** 藍色小巴士（天空藍，高車頂雙窗） */
export function PieceBus(props: ArtProps) {
  return (
    <Svg {...props}>
      <rect x="9" y="6" width="30" height="12" rx="5" fill="#6fc3f0" stroke="#3f93c4" strokeWidth="2" />
      <rect x="13" y="9" width="9" height="6" rx="3" fill="#fff" opacity="0.9" />
      <rect x="26" y="9" width="9" height="6" rx="3" fill="#fff" opacity="0.9" />
      <FaceBase body="#6fc3f0" bodyDark="#3f93c4" />
    </Svg>
  );
}

/** 鈴鈴清潔車（薄荷綠，頭頂掃把＋泡泡） */
export function PieceLingLing(props: ArtProps) {
  return (
    <Svg {...props}>
      <rect x="22.6" y="5" width="2.8" height="9" rx="1.4" fill="#caa06a" />
      <path d="M19 5h10l-1.6 4h-6.8L19 5Z" fill="#7fd4a8" stroke="#4aa87c" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="15" cy="8" r="2.4" fill="#d6f3ff" stroke="#9adcf5" strokeWidth="1.2" />
      <circle cx="33.5" cy="6.5" r="1.8" fill="#d6f3ff" stroke="#9adcf5" strokeWidth="1.2" />
      <FaceBase body="#7fd4a8" bodyDark="#4aa87c" />
    </Svg>
  );
}

/** 恐龍車多多（薰衣草紫，頭頂三根恐龍角板） */
export function PieceDuoDuo(props: ArtProps) {
  return (
    <Svg {...props}>
      <path d="M12 14l4-7 4 7" fill="#b18ef5" stroke="#8f6ad4" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M20 14l4-9 4 9" fill="#b18ef5" stroke="#8f6ad4" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M28 14l4-7 4 7" fill="#b18ef5" stroke="#8f6ad4" strokeWidth="1.6" strokeLinejoin="round" />
      <FaceBase body="#c9a8ff" bodyDark="#8f6ad4" />
    </Svg>
  );
}

/** 禮物盒（掉落物任務） */
export function PieceGift(props: ArtProps) {
  return (
    <Svg {...props}>
      <rect x="8" y="16" width="32" height="26" rx="6" fill="#ffb4cf" stroke="#e0779d" strokeWidth="2" />
      <rect x="8" y="22" width="32" height="5" fill="#fff" opacity="0.9" />
      <rect x="21.5" y="16" width="5" height="26" fill="#fff" opacity="0.9" />
      <path
        d="M24 15c-4 0-6.4-4.6-3.4-6.4 2.2-1.3 3.4 2 3.4 5 0-3 1.2-6.3 3.4-5 3 1.8.6 6.4-3.4 6.4Z"
        fill="#ffe16f"
        stroke="#e0b13d"
        strokeWidth="1.6"
      />
    </Svg>
  );
}

/** 髒髒格覆蓋（半透明泥點，蓋在格子底） */
export function DirtOverlay(props: ArtProps) {
  return (
    <Svg {...props}>
      <rect x="2" y="2" width="44" height="44" rx="10" fill="#9b8468" opacity="0.4" />
      <circle cx="14" cy="15" r="4" fill="#7a6450" opacity="0.5" />
      <circle cx="33" cy="12" r="3" fill="#7a6450" opacity="0.45" />
      <circle cx="36" cy="33" r="4.6" fill="#7a6450" opacity="0.5" />
      <circle cx="13" cy="35" r="3.2" fill="#7a6450" opacity="0.45" />
      <circle cx="25" cy="24" r="2.6" fill="#7a6450" opacity="0.4" />
    </Svg>
  );
}

/** 依圖案索引渲染（0..4 對應 CANDY_MATCH_PIECES 順序）。 */
export function PieceArt({ piece, size, style }: ArtProps & { piece: number }) {
  switch (piece) {
    case 0:
      return <PieceXiaoHong size={size} style={style} />;
    case 1:
      return <PieceTaxi size={size} style={style} />;
    case 2:
      return <PieceBus size={size} style={style} />;
    case 3:
      return <PieceLingLing size={size} style={style} />;
    case 4:
      return <PieceDuoDuo size={size} style={style} />;
    default:
      return null;
  }
}
