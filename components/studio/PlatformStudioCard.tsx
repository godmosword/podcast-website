import BrandMark from "@/components/BrandMark";
import type { PlatformIcon } from "@/lib/platforms";
import {
  listenUrlForStudioPlatform,
  type StudioIcon,
  type StudioPlatform,
} from "@/lib/studio/platforms";
import styles from "./PlatformStudioCard.module.css";

function isPodcastIcon(icon: StudioIcon): icon is PlatformIcon {
  return icon !== "soundon" && icon !== "vercel";
}

/** 收聽平台用官方標誌（不加章、不用品牌色底）；後台工具用中性文字章。 */
function PlatformBadge({ icon }: { icon: StudioIcon }) {
  if (isPodcastIcon(icon)) {
    return (
      <span className={styles.badge}>
        <BrandMark id={icon} surface="row" />
      </span>
    );
  }
  return (
    <span className={`${styles.badge} ${styles.badgeNeutral}`}>
      {icon === "soundon" ? (
        <span className={styles.badgeText}>SO</span>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden className={styles.badgeIcon}>
          <path d="M12 2L2 19.5h20L12 2z" fill="currentColor" />
        </svg>
      )}
    </span>
  );
}

type Props = {
  platform: StudioPlatform;
};

export default function PlatformStudioCard({ platform }: Props) {
  const listenUrl = listenUrlForStudioPlatform(platform);

  return (
    <article
      className={styles.card}
      style={{ borderLeftColor: platform.color }}
    >
      <div className={styles.head}>
        <PlatformBadge icon={platform.icon} />
        <div className={styles.meta}>
          <h3 className={styles.title}>{platform.label}</h3>
          <p className={styles.hint}>{platform.hint}</p>
        </div>
      </div>

      <div className={styles.actions}>
        <a
          href={platform.analyticsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.primaryBtn}
        >
          開啟後台
        </a>
        {listenUrl && (
          <a
            href={listenUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.secondaryLink}
          >
            聽眾頁
          </a>
        )}
      </div>
    </article>
  );
}
