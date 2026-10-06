/**
 * 《繽紛樂園》局內美術常數與共用樣式（原樣搬自 BlockDropView）。
 * 井面日夜都是馬卡龍奶油底，顏色刻意不吃主題 token（見 hardcoded-color-audit allowlist）。
 */
import type { CSSProperties } from "react";
import { TYPES, type PieceType } from "@/lib/games/block-drop/pieces";

export const COLS = 10;
export const ROWS = 20;
export const CELL = 18;
/** G-M1 井底深藍紫（封面同色系） */
export const WELL_BG_TOP = "#3d3f82";
export const WELL_BG_BOTTOM = "#2a2c5e";
export const BOARD_W = COLS * CELL;
export const BOARD_H = ROWS * CELL;
export const WIDE_MAX_BOARD_W = 460;
export const WIDE_SIDE_W = 150;

// UX-T6：inkSoft／accentPink 較原始配色加深（往 ink 方向混色），
// 讓文字／HUD 在淺色殼／面板上達 WCAG AA（4.5:1）；裝飾色（mint/peach/…）不動。
export const MACARON_THEME = {
  shell: "#fff7ed",
  shellDeep: "#ffe9d6",
  ink: "#5d4a67",
  inkSoft: "#7c6886",
  accentPink: "#a5567a",
  mint: "#b9f3db",
  peach: "#ffc4a8",
  lemon: "#ffe889",
  lavender: "#d8c7ff",
  sky: "#bde7ff",
  berry: "#ffb4cf",
  board: "#fffaf2",
  boardLine: "rgba(117,88,119,.08)",
};
export const CLAY_BLOCK_COLORS: Record<PieceType, string> = {
  I: "#8ddff0",
  O: "#ffe16f",
  T: "#c9b4ff",
  S: "#9de7b8",
  Z: "#ff9fb7",
  J: "#9dbbff",
  L: "#ffc28a",
};
export const COLORS: Record<PieceType, string> = {
  ...CLAY_BLOCK_COLORS,
};


// UX-T6：色盲／低對比友善的非顏色標記——七種方塊各配一個低調內嵌符號
// （圓／方／三角／菱形／十字／半月／星），以 data-URI SVG 疊加在方塊底色
// 上，不改動方塊本體色相。用純 CSS background-image 疊層而非額外 React
// 節點／SVG 元素，逐 cell 成本僅多一個字串比對，盤面 200 格重繪也不會有
// 明顯效能負擔。
const BLOCK_SYMBOL_SHAPES: Record<PieceType, string> = {
  I: '<circle cx="12" cy="12" r="4.4"/>',
  O: '<rect x="7.4" y="7.4" width="9.2" height="9.2" rx="1.8"/>',
  T: '<polygon points="12,6.8 17.2,17.2 6.8,17.2"/>',
  S: '<polygon points="12,6.3 17.7,12 12,17.7 6.3,12"/>',
  Z: '<path d="M9.6,6 h4.8 v3.6 h3.6 v4.8 h-3.6 v3.6 h-4.8 v-3.6 h-3.6 v-4.8 h3.6 z"/>',
  J: '<path d="M12,6.4 A5.6,5.6 0 0 1 12,17.6 Z"/>',
  L: '<polygon points="12,6.8 13.23,10.3 16.95,10.39 14,12.65 15.06,16.21 12,14.1 8.94,16.21 10,12.65 7.05,10.39 10.77,10.3"/>',
};
function makeBlockSymbolBg(type: PieceType): string {
  const shape = BLOCK_SYMBOL_SHAPES[type];
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">` +
    `<g fill="rgba(93,74,103,.4)" stroke="rgba(255,255,255,.55)" stroke-width="0.6">${shape}</g>` +
    `</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
// 模組層級預先算好每種方塊的符號 data-URI，避免每次 render 重新編碼字串。
export const BLOCK_SYMBOL_BG: Record<PieceType, string> = TYPES.reduce(
  (acc, t) => {
    acc[t] = makeBlockSymbolBg(t);
    return acc;
  },
  {} as Record<PieceType, string>,
);
export function primaryBtn(font: string): CSSProperties {
  return {
    border: "none",
    minHeight: 56,
    background: `linear-gradient(180deg,${MACARON_THEME.lemon},#ffbd6f)`,
    color: "#614018",
    fontWeight: 900,
    fontSize: 19,
    padding: "13px 30px",
    borderRadius: 999,
    cursor: "pointer",
    boxShadow:
      "0 8px 0 rgba(203,128,52,.42), 0 16px 24px rgba(164,103,61,.18), inset 0 2px 0 rgba(255,255,255,.72)",
    fontFamily: font,
  };
}

export function secondaryBtn(font: string): CSSProperties {
  return {
    border: "2px solid rgba(93,74,103,.12)",
    minHeight: 52,
    background: "rgba(255,255,255,.72)",
    color: MACARON_THEME.ink,
    fontWeight: 800,
    fontSize: 15,
    padding: "10px 20px",
    borderRadius: 999,
    cursor: "pointer",
    fontFamily: font,
  };
}

export const panelStyle: CSSProperties = {
  background:
    "linear-gradient(180deg,rgba(255,255,255,.9),rgba(255,246,238,.82))",
  border: "1px solid rgba(255,255,255,.9)",
  borderRadius: 18,
  padding: "8px 10px",
  textAlign: "center",
  boxShadow:
    "0 8px 18px rgba(158,118,122,.12), inset 0 1px 0 rgba(255,255,255,.85)",
};

export const panelLabel: CSSProperties = {
  color: MACARON_THEME.inkSoft,
  fontSize: 11,
  fontWeight: 900,
};

export const hintChip: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  background: "rgba(255,255,255,.82)",
  border: "1px solid rgba(255,255,255,.95)",
  borderRadius: 999,
  padding: "5px 12px",
  fontSize: 14,
  fontWeight: 900,
  color: MACARON_THEME.ink,
  boxShadow: "0 4px 10px rgba(126,96,112,.12)",
  whiteSpace: "nowrap",
};


export function blockStyle(type: PieceType, glow?: boolean): CSSProperties {
  const color = COLORS[type];
  return {
    width: "100%",
    height: "100%",
    backgroundImage: `${BLOCK_SYMBOL_BG[type]}, radial-gradient(circle at 28% 22%, rgba(255,255,255,.72), transparent 28%), linear-gradient(145deg, ${color}, color-mix(in srgb, ${color} 72%, #8f6f86))`,
    backgroundSize: "38% 38%, 100% 100%, 100% 100%",
    backgroundPosition: "center, 0 0, 0 0",
    backgroundRepeat: "no-repeat, no-repeat, no-repeat",
    borderRadius: 7,
    boxShadow: `inset 2px 2px 0 rgba(255,255,255,.56), inset -2px -3px 0 rgba(102,74,91,.18), 0 2px 5px rgba(121,83,99,.18)${glow ? `, 0 0 10px ${color}` : ""}`,
  };
}
