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
  /** 首頁等平台區已上移時，頁尾可只顯示社群 */
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
  const className = styles.item;
  const badge = (
    <>
      <span className={styles.badge} style={badgeStyle}>
        {children}
      </span>
      <span className={styles.label}>{label}</span>
    </>
  );

  if (!external) {
    return (
      <Link href={href} className={className} aria-label={ariaLabel}>
        {badge}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {badge}
    </a>
  );
}

/**
 * 頁尾訂閱／追蹤：社群與收聽平台分開顯示，圖示下方附平台名稱。
 */
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
      {socials.length > 0 && (
        <section className={styles.block} aria-labelledby={`${id}-social`}>
          <h2 id={`${id}-social`} className={styles.blockTitle}>
            <span className={`${styles.dot} ${styles.dotSocial}`} aria-hidden />
            追蹤我們
          </h2>
          <nav className={styles.row} aria-label="社群連結">
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
      )}

      {platforms.length > 0 && (
        <section
          className={styles.block}
          aria-labelledby={`${id}-platforms`}
        >
          <h2 id={`${id}-platforms`} className={styles.blockTitle}>
            <span
              className={`${styles.dot} ${styles.dotPlatform}`}
              aria-hidden
            />
            訂閱收聽
          </h2>
          <p className={styles.blockBlurb}>
            訂閱後，新集會自動出現在你的 Podcast App
          </p>
          <nav className={styles.row} aria-label="收聽平台">
            {platforms.map((p) => (
              <IconLink
                key={p.label}
                href={p.url}
                label={p.label}
                ariaLabel={`在 ${p.label} 收聽`}
                badgeStyle={{ backgroundColor: p.color }}
                onClick={() => trackPlatformClick(p.label, "footer-connect")}
              >
                <BrandSvg className={styles.icon}>
                  {PLATFORM_ICON_PATHS[p.icon]}
                </BrandSvg>
              </IconLink>
            ))}
          </nav>
        </section>
      )}
    </div>
  );
}
