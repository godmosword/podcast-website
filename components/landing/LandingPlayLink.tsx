"use client";

import { useRef, type MouseEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  beginLandingPlayback,
  cancelLandingPlayback,
} from "@/lib/landing-playback";

type LandingPlayLinkProps = {
  href: string;
  slug: string;
  audioSrc: string;
  className?: string;
  children: ReactNode;
};

function isModifiedClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

/** 一次點擊先啟播，再進播放器；修正跨頁 autoplay 會被瀏覽器阻擋的問題。 */
export default function LandingPlayLink({
  href,
  slug,
  audioSrc,
  className,
  children,
}: LandingPlayLinkProps) {
  const router = useRouter();
  const navigating = useRef(false);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (isModifiedClick(event)) return;
    event.preventDefault();
    if (navigating.current) return;
    navigating.current = true;

    const navigate = () => router.push(href);
    void beginLandingPlayback(slug, audioSrc).then(navigate, () => {
      // 若裝置拒播仍進播放器，讓既有 playBlocked／播放鈕提供明確復原路徑。
      cancelLandingPlayback();
      navigate();
    });
  }

  return (
    <a href={href} className={className} onClick={handleClick}>
      {children}
    </a>
  );
}
