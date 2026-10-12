/**
 * 站上實際使用的官方平台標誌。
 * 尺寸與留白依各品牌公開規範；禁止改色、裁切、拉變形。
 * 來源網址見 public/brand/SOURCES.md。
 */

export type OfficialMarkId =
  | "spotify"
  | "apple"
  | "youtube"
  | "instagram"
  | "threads"
  | "facebook";

type MarkFile = {
  src: string;
  width: number;
  height: number;
};

export type OfficialMarkSpec = {
  /** 淺色介面使用的原檔。 */
  light: MarkFile;
  /** 深色介面使用的原檔；省略表示日夜同一張。 */
  dark?: MarkFile;
  /** 顯示高度（px）。寬度依原圖比例自動算出。 */
  heightPx: number;
  /** 標誌四周留白（px）。 */
  clearSpacePx: number;
};

export const OFFICIAL_MARKS: Record<OfficialMarkId, OfficialMarkSpec> = {
  // 圖示最小 21px；留白＝圖示高度的一半。淺底用黑、深底用白（綠標只允許純黑或純白底）。
  spotify: {
    light: { src: "/brand/spotify-primary-black.png", width: 939, height: 940 },
    dark: { src: "/brand/spotify-primary-white.png", width: 939, height: 940 },
    heightPx: 32,
    clearSpacePx: 16,
  },
  // 徽章檔本身以 40px 高繪製，不縮小、不改色。留白取徽章高度的四分之一。
  apple: {
    light: {
      src: "/brand/apple-podcasts-listen-badge-zh-hant.svg",
      width: 165,
      height: 40,
    },
    heightPx: 40,
    clearSpacePx: 10,
  },
  // 數位最小高度 20px；留白＝整個字標的高度（與播放鍵圖示同高）。
  youtube: {
    light: { src: "/brand/youtube-logo.svg", width: 492, height: 110 },
    dark: { src: "/brand/youtube-logo-dark.svg", width: 493, height: 110 },
    heightPx: 24,
    clearSpacePx: 24,
  },
  // 官方主標為漸層圖示。顯示邊長 40px；留白取寬度的四分之一。
  instagram: {
    light: {
      src: "/brand/instagram-glyph-gradient.png",
      width: 256,
      height: 256,
    },
    heightPx: 40,
    clearSpacePx: 10,
  },
  // 數位最小寬度 16px；留白＝標誌寬度的四分之一。
  facebook: {
    light: {
      src: "/brand/facebook-logo-primary.png",
      width: 2084,
      height: 2084,
    },
    heightPx: 48,
    clearSpacePx: 12,
  },
  // 圖示可與字標分開使用。顯示寬約 32px；留白＝圖示寬度的四分之一。淺底黑、深底白。
  threads: {
    light: { src: "/brand/threads-logo-black.svg", width: 977, height: 1082 },
    dark: { src: "/brand/threads-logo-white.svg", width: 977, height: 1082 },
    heightPx: 35.45,
    clearSpacePx: 8,
  },
};

export function isOfficialMarkId(icon: string): icon is OfficialMarkId {
  return icon in OFFICIAL_MARKS;
}
