import { PLATFORM_ICON_PATHS, SOCIAL_ICON_PATHS } from "@/lib/connect-icons";
import { visiblePlatforms } from "@/lib/platforms";
import { visibleSocials } from "@/lib/social";
import styles from "./ConnectHub.module.css";

type Props = {
  /** 錨點 id，供關於頁等連結至頁尾 */
  id?: string;
  className?: string;
};

/**
 * 訂閱與追蹤：社群 + 收聽平台合併為單一精簡區塊（全站頁尾唯一入口）。
 */
export default function ConnectHub({ id = "connect", className }: Props) {
  const socials = visibleSocials();
  const platforms = visiblePlatforms();

  if (socials.length === 0 && platforms.length === 0) return null;

  return (
    <section
      id={id}
      className={`${styles.hub}${className ? ` ${className}` : ""}`}
      aria-labelledby={`${id}-title`}
    >
      <h2 id={`${id}-title`} className={styles.title}>
        <span className={styles.dot} aria-hidden />
        訂閱與追蹤
      </h2>
      <p className={styles.lead}>在喜歡的平台追蹤我們，就不會錯過新集數。</p>

      <nav className={styles.grid} aria-label="訂閱與追蹤連結">
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
          </a>
        ))}
      </nav>
    </section>
  );
}
