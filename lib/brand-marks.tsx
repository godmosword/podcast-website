import type { ReactNode } from "react";
import { BRAND_COLORS } from "@/lib/brand-assets";
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

// ── Meta 過渡圖形（同官方形狀；拿到 Meta Brand Resource Center 的檔後換掉） ──
const INSTAGRAM_PATH =
  "M7 2C4.24 2 2 4.24 2 7v10c0 2.76 2.24 5 5 5h10c2.76 0 5-2.24 5-5V7c0-2.76-2.24-5-5-5H7zm0 2h10c1.66 0 3 1.34 3 3v10c0 1.66-1.34 3-3 3H7c-1.66 0-3-1.34-3-3V7c0-1.66 1.34-3 3-3zm5 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm5.5-2.75a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5z";
const THREADS_PATH =
  "M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.166 1.43 1.781 3.631 2.695 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.36-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291.92-.053 1.83.018 2.66.193-.025-.95-.27-1.681-.729-2.18-.581-.633-1.473-.957-2.651-.966h-.034c-.78 0-1.836.214-2.51 1.21l-1.696-1.139c.9-1.33 2.357-2.063 4.205-2.063h.052c3.092.02 4.935 1.918 5.118 5.227.105.044.208.09.31.139 1.439.677 2.493 1.702 3.048 2.965.772 1.762.825 4.636-1.55 7-1.815 1.748-4.02 2.542-7.165 2.565zm-1.3-12.06c-.234 0-.47.007-.708.02-1.788.103-2.9.918-2.834 2.075.07 1.21 1.405 1.774 2.69 1.705 1.18-.064 2.717-.523 2.974-3.51a8.276 8.276 0 0 0-2.122-.29z";
const FACEBOOK_PATH =
  "M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z";
// ── 自有 ──
const EMAIL_PATH =
  "M5.7 6.5h12.6c1.12 0 2 .88 2 2v7c0 1.12-.88 2-2 2H5.7c-1.12 0-2-.88-2-2v-7c0-1.12.88-2 2-2zm.22 2.1 5.56 4.16c.31.23.73.23 1.04 0l5.56-4.16H5.92zm12.68 1.6-4.8 3.58a3 3 0 0 1-3.6 0L5.4 10.2v5.04c0 .34.26.6.6.6h12c.34 0 .6-.26.6-.6V10.2zm-5.08 4.1c.34-.35.9-.35 1.24 0l.14.14.14-.14a.87.87 0 0 1 1.24 1.22l-1.38 1.36-1.38-1.36a.87.87 0 0 1 0-1.22z";

const INSTAGRAM_STOPS: ReadonlyArray<readonly [string, string]> = [
  ["0", "#f09433"],
  ["0.25", "#e6683c"],
  ["0.5", "#dc2743"],
  ["0.75", "#cc2366"],
  ["1", "#bc1888"],
];

const instagram = (tone: "gradient" | "white"): InlineArt => ({
  kind: "inline",
  tone,
  viewBox: "2 2 20 20",
  render: (uid) =>
    tone === "white" ? (
      <path d={INSTAGRAM_PATH} fill="#ffffff" />
    ) : (
      <>
        <defs>
          <linearGradient id={`${uid}-ig`} x1="0" y1="1" x2="1" y2="0">
            {INSTAGRAM_STOPS.map(([offset, color]) => (
              <stop key={offset} offset={offset} stopColor={color} />
            ))}
          </linearGradient>
        </defs>
        <path d={INSTAGRAM_PATH} fill={`url(#${uid}-ig)`} />
      </>
    ),
});

const threads = (tone: "black" | "white"): InlineArt => ({
  kind: "inline",
  tone,
  viewBox: "0 0 24 24",
  render: () => <path d={THREADS_PATH} fill={tone === "white" ? "#ffffff" : "#000000"} />,
});

const facebook: InlineArt = {
  kind: "inline",
  tone: "brand",
  viewBox: "0 0 24 24",
  // 藍底白 f：f 在官方檔是白色，這裡墊白圓讓鏤空處在任何底上都是白的
  render: () => (
    <>
      <circle cx="12" cy="12.2" r="11.3" fill="#ffffff" />
      <path d={FACEBOOK_PATH} fill={BRAND_COLORS.facebook} />
    </>
  ),
};

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
      white: image("/brand/spotify-icon-green.png"),
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
  youtube: { sizing: { aspect: 158 / 110, fit: "width" }, art: same(image("/brand/youtube-icon.svg")) },
  instagram: {
    sizing: "square",
    interim: true,
    art: { white: instagram("gradient"), light: instagram("gradient"), dark: instagram("white") },
  },
  threads: {
    sizing: "square",
    interim: true,
    art: { white: threads("black"), light: threads("black"), dark: threads("white") },
  },
  facebook: { sizing: "square", interim: true, art: same(facebook) },
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
