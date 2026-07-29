"use client";

import { useEffect, useState } from "react";
import styles from "./OpenInAppCTA.module.css";

type Props = {
  /** 本集 Universal Link（絕對或相對皆可；建議絕對）。 */
  href: string;
  /** 可選 App Store 頁；未設則只顯示 Universal Link。 */
  storeUrl?: string | null;
  className?: string;
};

function isAppleMobile(ua: string): boolean {
  return /iPhone|iPad|iPod/i.test(ua);
}

/**
 * 單集頁次要 CTA：已安裝 App 時走 Universal Link；可選導向 App Store。
 * 成長主戰場仍為 Podcast 平台訂閱；此鈕不取代平台 CTA。
 */
export default function OpenInAppCTA({ href, storeUrl, className }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(isAppleMobile(navigator.userAgent));
  }, []);

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
        {storeUrl ? (
          <a
            className={styles.secondary}
            href={storeUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            App Store
          </a>
        ) : null}
      </div>
    </aside>
  );
}
