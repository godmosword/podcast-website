import { BrandSvg, PLATFORM_ICON_PATHS } from "@/lib/connect-icons";
import type { PlatformIcon } from "@/lib/platforms";
import {
  listenUrlForStudioPlatform,
  type StudioIcon,
  type StudioPlatform,
} from "@/lib/studio/platforms";
import styles from "./PlatformStudioCard.module.css";

function isPodcastIcon(icon: StudioIcon): icon is PlatformIcon {
  return icon in PLATFORM_ICON_PATHS;
}

function PlatformBadge({ icon, color }: { icon: StudioIcon; color: string }) {
  if (icon === "soundon") {
    return (
      <span className={styles.badge} style={{ backgroundColor: color }}>
        <span className={styles.badgeText}>SO</span>
      </span>
    );
  }
  if (icon === "vercel") {
    return (
      <span className={styles.badge} style={{ backgroundColor: color }}>
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M12 2L2 19.5h20L12 2z" fill="currentColor" />
        </svg>
      </span>
    );
  }
  if (isPodcastIcon(icon)) {
    return (
      <span className={styles.badge} style={{ backgroundColor: color }}>
        <BrandSvg className={styles.badgeIcon}>
          {PLATFORM_ICON_PATHS[icon]}
        </BrandSvg>
      </span>
    );
  }
  return (
    <span className={styles.badge} style={{ backgroundColor: color }}>
      <span className={styles.badgeText}>?</span>
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
        <PlatformBadge icon={platform.icon} color={platform.color} />
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
