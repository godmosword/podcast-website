"use client";

import Link from "next/link";
import {
  BrandSvg,
  PLATFORM_ICON_PATHS,
  SOCIAL_ICON_PATHS,
} from "@/lib/connect-icons";
import { trackPlatformClick } from "@/lib/analytics";
import { visiblePlatforms } from "@/lib/platforms";
import { visibleSocials } from "@/lib/social";
import styles from "./ConnectHub.module.css";

type Props = {
  /** 錨點 id，供關於頁等連結至頁尾 */
  id?: string;
  className?: string;
  /** 是否顯示收聽平台圖示 */
  showPlatforms?: boolean;
};

function IconLink({
  href,
  label,
  ariaLabel,
  badgeStyle,
  children,
  external = true,
  onClick,
}: {
  href: string;
  label: string;
  ariaLabel: string;
  badgeStyle?: React.CSSProperties;
  children: React.ReactNode;
  external?: boolean;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className={styles.badge} style={badgeStyle}>
        {children}
      </span>
      <span className={styles.label}>{label}</span>
    </>
  );

  if (!external) {
    return (
      <Link href={href} className={styles.item} aria-label={ariaLabel}>
        {content}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.item}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {content}
    </a>
  );
}

/** 頁尾訂閱與追蹤：圓形圖示合併於同一區塊。 */
export default function ConnectHub({
  id = "connect",
  className,
  showPlatforms = true,
}: Props) {
  const socials = visibleSocials();
  const platforms = showPlatforms ? visiblePlatforms() : [];

  if (socials.length === 0 && platforms.length === 0) return null;

  return (
    <div
      id={id || undefined}
      className={`${styles.hub}${className ? ` ${className}` : ""}`}
    >
      <section className={styles.block} aria-labelledby={`${id}-heading`}>
        <h2 id={`${id}-heading`} className={styles.blockTitle}>
          <span className={`${styles.dot} ${styles.dotPlatform}`} aria-hidden />
          訂閱與追蹤
        </h2>
        {platforms.length > 0 && (
          <p className={styles.blockBlurb}>
            訂閱後，新集會自動出現在你的 Podcast App
          </p>
        )}
        <nav className={styles.row} aria-label="訂閱與社群連結">
          {platforms.map((p) => (
            <IconLink
              key={p.label}
              href={p.url}
              label={p.label}
              ariaLabel={`在 ${p.label} 訂閱`}
              badgeStyle={{ background: p.color }}
              onClick={() => trackPlatformClick(p.label, "footer-connect")}
            >
              <BrandSvg className={styles.icon}>
                {PLATFORM_ICON_PATHS[p.icon]}
              </BrandSvg>
            </IconLink>
          ))}
          {socials.map((s) => (
            <IconLink
              key={s.label}
              href={s.url}
              label={s.label}
              ariaLabel={`前往 ${s.label}`}
              badgeStyle={{ background: s.background }}
            >
              <BrandSvg className={styles.icon}>
                {SOCIAL_ICON_PATHS[s.icon]}
              </BrandSvg>
            </IconLink>
          ))}
        </nav>
      </section>
    </div>
  );
}
