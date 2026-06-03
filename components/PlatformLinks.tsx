import type { PlatformIcon } from "@/lib/platforms";
import { visiblePlatforms } from "@/lib/platforms";
import styles from "./PlatformLinks.module.css";

// 品牌圖示（白色填色，襯在品牌色圓底上）。viewBox 皆為 0 0 24 24。
const ICONS: Record<PlatformIcon, React.ReactNode> = {
  apple: (
    // 麥克風（Apple Podcasts 風格）
    <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" />
  ),
  spotify: (
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.52 17.34c-.24.36-.66.48-1.02.24-2.82-1.74-6.36-2.1-10.56-1.14-.42.12-.78-.18-.9-.54-.12-.42.18-.78.54-.9 4.56-1.02 8.52-.6 11.64 1.32.42.18.48.66.3 1.02zm1.44-3.3c-.3.42-.84.6-1.26.3-3.24-1.98-8.16-2.58-11.94-1.38-.48.12-1.02-.12-1.14-.6-.12-.48.12-1.02.6-1.14 4.38-1.32 9.84-.66 13.56 1.62.36.18.6.78.18 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.1 9.3c-.6.18-1.26-.18-1.44-.78-.18-.6.18-1.26.78-1.44 4.32-1.32 11.4-1.02 15.84 1.62.54.3.72 1.02.42 1.56-.3.48-1.02.66-1.56.36z" />
  ),
  kkbox: (
    // 音符
    <path d="M19 3l-9 2v9.55A4 4 0 1 0 12 18V7.6l5-1.11V12.5A4 4 0 1 0 19 16V3z" />
  ),
  youtube: (
    <path d="M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.51A3.02 3.02 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3.02 3.02 0 0 0 2.12 2.14c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3.02 3.02 0 0 0 2.12-2.14A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8zM9.55 15.57V8.43L15.82 12l-6.27 3.57z" />
  ),
  soundon: (
    <path d="M12 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7V3zm0 4a5 5 0 0 0-5 5h2a3 3 0 1 1 3-3V7zm-1 6v6l5-3-5-3z" />
  ),
  rss: (
    <path d="M6.18 15.64a2.18 2.18 0 1 1 0 4.36 2.18 2.18 0 0 1 0-4.36zM4 4v4.36c7.44 0 13.5 6.06 13.5 13.5H22C22 11.03 12.97 2 4 2V4zm0 6v4.36c3.73 0 6.78 3.05 6.78 6.78H18c0-5.47-4.53-10-10-10z" />
  ),
};

type Props = {
  /** 區塊標題，預設「在這裡收聽」 */
  heading?: string;
  /** 主題色，用於標題前的小圓點裝飾 */
  accent?: string;
};

/**
 * 收聽平台圖示列：Apple Podcasts / Spotify / KKBOX / YouTube。
 * 連結來自 lib/platforms.ts，每集故事頁與頁尾共用。
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
                {ICONS[p.icon]}
              </svg>
            </span>
            <span className={styles.label}>{p.label}</span>
          </a>
        ))}
      </nav>
    </section>
  );
}
