import type { SocialIcon } from "@/lib/social";
import { visibleSocials } from "@/lib/social";
import styles from "./SocialLinks.module.css";

// 品牌圖示（白色填色）。viewBox 皆為 0 0 24 24。
const ICONS: Record<SocialIcon, React.ReactNode> = {
  instagram: (
    <path d="M7 2C4.24 2 2 4.24 2 7v10c0 2.76 2.24 5 5 5h10c2.76 0 5-2.24 5-5V7c0-2.76-2.24-5-5-5H7zm0 2h10c1.66 0 3 1.34 3 3v10c0 1.66-1.34 3-3 3H7c-1.66 0-3-1.34-3-3V7c0-1.66 1.34-3 3-3zm5 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm5.5-2.75a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5z" />
  ),
  threads: (
    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.166 1.43 1.781 3.631 2.695 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.36-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291.92-.053 1.83.018 2.66.193-.025-.95-.27-1.681-.729-2.18-.581-.633-1.473-.957-2.651-.966h-.034c-.78 0-1.836.214-2.51 1.21l-1.696-1.139c.9-1.33 2.357-2.063 4.205-2.063h.052c3.092.02 4.935 1.918 5.118 5.227.105.044.208.09.31.139 1.439.677 2.493 1.702 3.048 2.965.772 1.762.825 4.636-1.55 7.0-1.815 1.748-4.02 2.542-7.165 2.565zm-1.3-12.06c-.234 0-.47.007-.708.02-1.788.103-2.9.918-2.834 2.075.07 1.21 1.405 1.774 2.69 1.705 1.18-.064 2.717-.523 2.974-3.51a8.276 8.276 0 0 0-2.122-.29z" />
  ),
};

type Props = {
  /** 額外 class（讓呼叫端微調外距） */
  className?: string;
};

/**
 * 社群圖示列：Instagram / Threads。
 * 連結來自 lib/social.ts，首頁標頭與頁尾共用。
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
              {ICONS[s.icon]}
            </svg>
          </span>
        </a>
      ))}
    </nav>
  );
}
