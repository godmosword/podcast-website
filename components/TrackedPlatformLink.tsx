"use client";

import type { PlatformClickSource } from "@/lib/analytics";
import { trackPlatformClick } from "@/lib/analytics";
import { appendPlatformUtm } from "@/lib/platform-utm";

type Props = {
  href: string;
  label: string;
  source: PlatformClickSource;
  /** utm_campaign：單集 slug 或省略為 site */
  campaign?: string;
  className?: string;
  children: React.ReactNode;
};

export default function TrackedPlatformLink({
  href,
  label,
  source,
  campaign,
  className,
  children,
}: Props) {
  const trackedHref = appendPlatformUtm(href, { source, campaign });

  return (
    <a
      href={trackedHref}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label={`在 ${label} 收聽`}
      onClick={() => trackPlatformClick(label, source)}
    >
      {children}
    </a>
  );
}
