import { BRAND_COLORS } from "@/lib/connect-icons";

// ============================================================
// 車車遊樂園 — 社群連結（單一資料來源）
// ============================================================
// 集中管理 Instagram / Threads 等社群連結，首頁標頭與頁尾共用。
// url 留空字串會自動隱藏，避免失效連結。
// ============================================================

/** 圖示識別字，對應 lib/connect-icons.tsx 內的 SVG。 */
export type SocialIcon = "instagram" | "threads" | "facebook" | "email";

export type Social = {
  /** 顯示名稱（也作為 aria-label） */
  label: string;
  /** 連結 */
  url: string;
  /** 圖示底色（可為 CSS 漸層字串） */
  background: string;
  /** 品牌圖示識別字 */
  icon: SocialIcon;
};

/** 社群清單（顯示順序即陣列順序）。 */
const SOCIALS: Social[] = [
  {
    label: "Instagram",
    url: "https://www.instagram.com/s32183218",
    background:
      "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
    icon: "instagram",
  },
  {
    label: "Threads",
    url: "https://www.threads.com/@bonboncarstory",
    background: BRAND_COLORS.threads,
    icon: "threads",
  },
  {
    label: "Facebook",
    url: "https://www.facebook.com/profile.php?id=61590533437349",
    background: BRAND_COLORS.facebook,
    icon: "facebook",
  },
  {
    label: "Email",
    url: "mailto:bonboncarstory@gmail.com",
    background: "linear-gradient(135deg, var(--c-sky), var(--c-mint))",
    icon: "email",
  },
];

/** 只取有填連結的社群。 */
export function visibleSocials(): Social[] {
  return SOCIALS.filter((s) => s.url.trim() !== "");
}
