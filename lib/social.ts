// ============================================================
// 車車遊樂園 — 社群連結（單一資料來源）
// ============================================================
// 集中管理 Instagram / Threads 等社群連結，首頁標頭與頁尾共用。
// url 留空字串會自動隱藏，避免失效連結。
// ============================================================

/** 標誌識別字，對應 lib/brand-marks.tsx。 */
export type SocialIcon = "instagram" | "threads" | "facebook" | "email";

export type Social = {
  /** 顯示名稱（也作為 aria-label） */
  label: string;
  /** 連結 */
  url: string;
  /** 品牌圖示識別字 */
  icon: SocialIcon;
};

/** 社群清單（顯示順序即陣列順序）。 */
const SOCIALS: Social[] = [
  {
    label: "Instagram",
    url: "https://www.instagram.com/s32183218",
    icon: "instagram",
  },
  {
    label: "Threads",
    url: "https://www.threads.com/@bonboncarstory",
    icon: "threads",
  },
  {
    label: "Facebook",
    url: "https://www.facebook.com/profile.php?id=61590533437349",
    icon: "facebook",
  },
  {
    label: "Email",
    url: "mailto:carcarplayground@gmail.com",
    icon: "email",
  },
];

/** 只取有填連結的社群。 */
export function visibleSocials(): Social[] {
  return SOCIALS.filter((s) => s.url.trim() !== "");
}

/** 頂欄社群下拉：不含 Email。聯絡仍走頁尾「聯絡我們」。 */
export function visibleNavSocials(): Social[] {
  return visibleSocials().filter((s) => s.icon !== "email");
}
