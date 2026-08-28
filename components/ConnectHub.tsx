"use client";

import Link from "next/link";
import {
  BrandSvg,
  PLATFORM_ICON_PATHS,
  SOCIAL_ICON_PATHS,
} from "@/lib/connect-icons";
import { trackPlatformClick } from "@/lib/analytics";
import { appendPlatformUtm } from "@/lib/platform-utm";
import { visiblePlatforms } from "@/lib/platforms";
import { visibleSocials } from "@/lib/social";
import styles from "./ConnectHub.module.css";

type Props = {
  /** 錨點 id，供關於頁等連結至頁尾 */
  id?: string;
  className?: string;
  /** 是否顯示收聽平台圖示 */
  showPlatforms?: boolean;
  /** utm_campaign：單集 slug；未傳則為 site */
  campaign?: string;
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
  const opensNewTab = external && !href.startsWith("mailto:");

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
      {...(opensNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={styles.item}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {content}
    </a>
  );
}

/** 頁尾頻道與訂閱追蹤：分兩區塊，圓形圖示。 */
export default function ConnectHub({
  id = "connect",
  className,
  showPlatforms = true,
  campaign,
}: Props) {
  const socials = visibleSocials();
  const platforms = showPlatforms ? visiblePlatforms() : [];

  if (socials.length === 0 && platforms.length === 0) return null;

  return (
    <div
      id={id || undefined}
      className={`${styles.hub}${className ? ` ${className}` : ""}`}
    >
      {platforms.length > 0 && (
        <section className={styles.block} aria-labelledby={`${id}-listen`}>
          <h2 id={`${id}-listen`} className={styles.blockTitle}>
            <span
              className={`${styles.dot} ${styles.dotPlatform}`}
              aria-hidden
            />
            頻道
          </h2>
          <nav className={styles.row} aria-label="收聽平台">
            {platforms.map((p) => (
              <IconLink
                key={p.label}
                href={appendPlatformUtm(p.url, {
                  source: "footer-connect",
                  campaign,
                })}
                label={p.label}
                ariaLabel={`在 ${p.label} 收聽`}
                badgeStyle={{ background: p.color }}
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

      {socials.length > 0 && (
        <section className={styles.block} aria-labelledby={`${id}-follow`}>
          <h2 id={`${id}-follow`} className={styles.blockTitle}>
            <span className={`${styles.dot} ${styles.dotSocial}`} aria-hidden />
            訂閱追蹤
          </h2>
          <nav className={styles.row} aria-label="社群連結">
            {socials.map((s) => (
              <IconLink
                key={s.label}
                href={s.url}
                label={s.label}
                ariaLabel={
                  s.url.startsWith("mailto:")
                    ? `寄信到 ${s.url.replace(/^mailto:/, "")}`
                    : `前往 ${s.label}`
                }
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
    </div>
  );
}
