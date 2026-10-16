import type { ReactNode } from "react";
import type { PlatformIcon } from "@/lib/platforms";
import type { SocialIcon } from "@/lib/social";

// ============================================================
// 車車遊樂園 — 平台／社群標誌登記（單一資料來源）
// ============================================================
// 規則見 lib/BRAND-ASSETS-HARD-RULES.md：官方檔、原比例、只用各家提供的色版。
// 一致化只動三件事：章、視覺尺寸（全站 30px）、間距。標誌本身不改。
// ============================================================

export type BrandMarkId = PlatformIcon | SocialIcon;

/**
 * 標誌所在的底：
 * - `white`：頁尾的純白章（日間）→ 品牌標準色
 * - `light`：其他淺色底（文字列、hover 底色）→ 黑色版
 * - `dark`：夜間深色底 → 白色版
 */
export type BrandMarkSurface = "white" | "light" | "dark";

type ImageArt = { kind: "image"; src: string };
type InlineArt = {
  kind: "inline";
  tone: "black" | "white" | "gradient" | "brand" | "accent";
  viewBox: string;
  /** uid 給漸層 id 用，同頁多個標誌不互撞 */
  render: (uid: string) => ReactNode;
};
export type BrandMarkArt = ImageArt | InlineArt;

type Sizing = "square" | { aspect: number; fit: "width" } | { aspect: number; fixedWidth: number };

export type BrandMarkSpec = {
  sizing: Sizing;
  art: Record<BrandMarkSurface, BrandMarkArt>;
  /** 官方檔尚未取得，暫用同形狀路徑（Meta 下載需本人接受條款） */
  interim?: true;
  /** 自有圖示，不受第三方規範 */
  own?: true;
};

/** 全站視覺尺寸：Instagram 最小 29px，取 30。 */
export const BRAND_MARK_SIZE = 30;

const image = (src: string): ImageArt => ({ kind: "image", src });
const same = (art: BrandMarkArt): Record<BrandMarkSurface, BrandMarkArt> => ({
  white: art,
  light: art,
  dark: art,
});

// ── 自有 ──
const EMAIL_PATH =
  "M5.7 6.5h12.6c1.12 0 2 .88 2 2v7c0 1.12-.88 2-2 2H5.7c-1.12 0-2-.88-2-2v-7c0-1.12.88-2 2-2zm.22 2.1 5.56 4.16c.31.23.73.23 1.04 0l5.56-4.16H5.92zm12.68 1.6-4.8 3.58a3 3 0 0 1-3.6 0L5.4 10.2v5.04c0 .34.26.6.6.6h12c.34 0 .6-.26.6-.6V10.2zm-5.08 4.1c.34-.35.9-.35 1.24 0l.14.14.14-.14a.87.87 0 0 1 1.24 1.22l-1.38 1.36-1.38-1.36a.87.87 0 0 1 0-1.22z";

const email: InlineArt = {
  kind: "inline",
  tone: "accent",
  viewBox: "2.5 2.5 19 19",
  render: () => <path d={EMAIL_PATH} fill="var(--accent-ink)" />,
};

export const BRAND_MARKS: Record<BrandMarkId, BrandMarkSpec> = {
  apple: { sizing: "square", art: same(image("/brand/apple-podcasts-icon.png")) },
  spotify: {
    sizing: "square",
    art: {
      // 不用綠色版：該檔已下架。白章與其他淺色底都用黑色官方圖示。
      white: image("/brand/spotify-icon-black.png"),
      light: image("/brand/spotify-icon-black.png"),
      dark: image("/brand/spotify-icon-white.png"),
    },
  },
  kkbox: {
    sizing: { aspect: 786 / 164, fixedWidth: 38 },
    art: {
      white: image("/brand/kkbox-logo.svg"),
      light: image("/brand/kkbox-logo-black.svg"),
      dark: image("/brand/kkbox-logo-white.svg"),
    },
  },
  youtube: {
    // 完整字標（高 24px，規範最小 20px）。不使用裁切後的圖示檔。
    sizing: { aspect: 492 / 110, fixedWidth: 108 },
    art: {
      white: image("/brand/youtube-logo.svg"),
      light: image("/brand/youtube-logo.svg"),
      dark: image("/brand/youtube-logo-dark.svg"),
    },
  },
  instagram: {
    sizing: "square",
    art: same(image("/brand/instagram-glyph-gradient.png")),
  },
  threads: {
    sizing: { aspect: 977 / 1082, fixedWidth: 27 },
    art: {
      white: image("/brand/threads-logo-black.svg"),
      light: image("/brand/threads-logo-black.svg"),
      dark: image("/brand/threads-logo-white.svg"),
    },
  },
  facebook: { sizing: "square", art: same(image("/brand/facebook-logo-primary.png")) },
  email: { sizing: "square", own: true, art: same(email) },
};

/** 視覺尺寸 s 換算成實際寬高（依官方檔比例，不變形）。 */
export function brandMarkBox(id: BrandMarkId, s: number = BRAND_MARK_SIZE): { width: number; height: number } {
  const { sizing } = BRAND_MARKS[id];
  if (sizing === "square") return { width: s, height: s };
  if ("fixedWidth" in sizing) {
    const width = Math.round((sizing.fixedWidth * s) / BRAND_MARK_SIZE);
    return { width, height: Number((width / sizing.aspect).toFixed(2)) };
  }
  return { width: s, height: Number((s / sizing.aspect).toFixed(2)) };
}
