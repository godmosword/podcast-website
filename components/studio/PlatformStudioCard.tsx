import { PLATFORM_ICON_PATHS } from "@/lib/connect-icons";
import { metricsForPlatform } from "@/lib/studio/metrics";
import {
  listenUrlForStudioPlatform,
  type StudioIcon,
  type StudioPlatform,
} from "@/lib/studio/platforms";
import styles from "./PlatformStudioCard.module.css";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString("zh-TW");
}

function formatRate(rate: number): string {
  return `${Math.round(rate * 100)}%`;
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
  const path = PLATFORM_ICON_PATHS[icon];
  return (
    <span className={styles.badge} style={{ backgroundColor: color }}>
      <svg viewBox="0 0 24 24" aria-hidden>
        {path}
      </svg>
    </span>
  );
}

type Props = {
  platform: StudioPlatform;
};

export default function PlatformStudioCard({ platform }: Props) {
  const metrics = metricsForPlatform(platform.id);
  const listenUrl = listenUrlForStudioPlatform(platform);
  const hasMetrics =
    metrics &&
    (metrics.plays != null ||
      metrics.listeners != null ||
      metrics.followers != null ||
      metrics.completionRate != null);

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

      <div className={styles.stats} aria-label={`${platform.label} 數據`}>
        <div>
          <div className={styles.statLabel}>播放</div>
          <div className={styles.statValue}>
            {metrics?.plays != null ? formatNumber(metrics.plays) : "—"}
          </div>
        </div>
        <div>
          <div className={styles.statLabel}>聽眾</div>
          <div className={styles.statValue}>
            {metrics?.listeners != null
              ? formatNumber(metrics.listeners)
              : "—"}
          </div>
        </div>
        <div>
          <div className={styles.statLabel}>追蹤</div>
          <div className={styles.statValue}>
            {metrics?.followers != null
              ? formatNumber(metrics.followers)
              : "—"}
          </div>
        </div>
        <div>
          <div className={styles.statLabel}>完聽率</div>
          <div className={styles.statValue}>
            {metrics?.completionRate != null
              ? formatRate(metrics.completionRate)
              : "—"}
          </div>
        </div>
        {!hasMetrics && (
          <p className={styles.hint} style={{ gridColumn: "1 / -1", margin: 0 }}>
            尚未接上 API
            {metrics?.periodLabel ? ` · ${metrics.periodLabel}` : ""}
          </p>
        )}
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
