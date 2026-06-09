import { BrandSvg, PLATFORM_ICON_PATHS } from "@/lib/connect-icons";
import { visiblePlatforms } from "@/lib/platforms";
import styles from "./PlatformLinks.module.css";

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
              <BrandSvg className={styles.icon}>
                {PLATFORM_ICON_PATHS[p.icon]}
              </BrandSvg>
            </span>
            <span className={styles.label}>{p.label}</span>
          </a>
        ))}
      </nav>
    </section>
  );
}
