import { SOCIAL_ICON_PATHS } from "@/lib/connect-icons";
import { visibleSocials } from "@/lib/social";
import styles from "./SocialLinks.module.css";

type Props = {
  /** 額外 class（讓呼叫端微調外距） */
  className?: string;
};

/**
 * 社群圖示列（精簡版，僅供需要單獨顯示社群的版面）。
 * 全站訂閱／追蹤請用 ConnectHub。
 */
export default function SocialLinks({ className }: Props) {
  const socials = visibleSocials();
  if (socials.length === 0) return null;

  return (
    <nav
      className={`${styles.row}${className ? ` ${className}` : ""}`}
      aria-label="社群連結"
    >
      {socials.map((s) => (
        <a
          key={s.label}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.item}
          aria-label={`前往 ${s.label}`}
          title={s.label}
        >
          <span className={styles.badge} style={{ background: s.background }}>
            <svg
              viewBox="0 0 24 24"
              className={styles.icon}
              fill="currentColor"
              aria-hidden
              focusable="false"
            >
              {SOCIAL_ICON_PATHS[s.icon]}
            </svg>
          </span>
        </a>
      ))}
    </nav>
  );
}
