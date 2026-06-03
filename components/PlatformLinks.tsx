import { PLATFORM_ICON_PATHS } from "@/lib/connect-icons";
import { visiblePlatforms } from "@/lib/platforms";
import styles from "./PlatformLinks.module.css";

type Props = {
  /** 區塊標題，預設「在這裡收聽」；傳空字串可隱藏 */
  heading?: string;
  /** 主題色，用於標題前的小圓點裝飾 */
  accent?: string;
};

/**
 * 收聽平台圖示列（故事詳情頁等情境使用）。
 * 全站訂閱入口以頁尾 ConnectHub 為主，避免首頁重複。
 */
export default function PlatformLinks({
  heading = "在這裡收聽",
  accent,
}: Props) {
  const platforms = visiblePlatforms();
  if (platforms.length === 0) return null;

  return (
    <section className={styles.wrap} aria-label="收聽平台">
      {heading !== "" && (
        <h2 className={styles.heading}>
          <span
            className={styles.dot}
            style={accent ? { backgroundColor: accent } : undefined}
            aria-hidden
          />
          {heading}
        </h2>
      )}
      <nav className={styles.row}>
        {platforms.map((p) => (
          <a
            key={p.label}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.item}
            aria-label={`在 ${p.label} 收聽`}
            title={p.label}
          >
            <span
              className={styles.badge}
              style={{ backgroundColor: p.color }}
            >
              <svg
                viewBox="0 0 24 24"
                className={styles.icon}
                fill="currentColor"
                aria-hidden
                focusable="false"
              >
                {PLATFORM_ICON_PATHS[p.icon]}
              </svg>
            </span>
            <span className={styles.label}>{p.label}</span>
          </a>
        ))}
      </nav>
    </section>
  );
}
