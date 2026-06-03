/** 全站預設 Open Graph 圖（public 路徑）。 */
export const DEFAULT_OG_IMAGE = "/mascot.png";

/** 站點絕對網址（RSS、metadata、分享連結用）。 */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}
