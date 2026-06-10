"use client";

import type { PlatformClickSource } from "@/lib/analytics";
import { trackPlatformClick } from "@/lib/analytics";

type Props = {
  href: string;
  label: string;
  source: PlatformClickSource;
  className?: string;
  children: React.ReactNode;
};

export default function TrackedPlatformLink({
  href,
  label,
  source,
  className,
  children,
}: Props) {
  return (
    <a
      href={href}
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
