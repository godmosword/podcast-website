"use client";

import { useEffect, useState } from "react";
import styles from "./OpenInAppCTA.module.css";

type Props = {
  /** 本集 Universal Link（絕對或相對皆可；建議絕對）。 */
  href: string;
  /**
   * App Store 產品頁（`NEXT_PUBLIC_IOS_APP_STORE_URL`）。
   * **未設 = App 尚未上架 → 整個 CTA 不渲染**：沒裝 App 的人點 Universal Link
   * 只會原地重載本頁，等於用單集頁最貴的版位換一個死路。
   */
  storeUrl?: string | null;
  className?: string;
};

/**
 * iPhone 直接看 UA；iPadOS Safari 預設送桌面版 UA（`Macintosh`），
 * 需靠 touch point 數量才認得出來。
 */
function isAppleMobile(nav: Navigator): boolean {
  const ua = nav.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  return /Macintosh/i.test(ua) && nav.maxTouchPoints > 1;
}

/**
 * 單集頁次要 CTA：已安裝 App 時走 Universal Link；未安裝則導向 App Store。
 * 成長主戰場仍為 Podcast 平台訂閱；此鈕不取代平台 CTA。
 */
export default function OpenInAppCTA({ href, storeUrl, className }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(isAppleMobile(navigator));
  }, []);

  if (!storeUrl) return null;
  if (!show) return null;

  return (
    <aside
      className={`${styles.wrap}${className ? ` ${className}` : ""}`}
      aria-label="在 App 看圖聽故事"
    >
      <p className={styles.lead}>想離線翻頁聽？用 iPhone App 看圖聽故事</p>
      <div className={styles.actions}>
        <a className={styles.primary} href={href}>
          用 App 開啟本集
        </a>
        <a
          className={styles.secondary}
          href={storeUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          App Store
        </a>
      </div>
    </aside>
  );
}
