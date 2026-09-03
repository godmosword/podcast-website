"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { isImmersiveRoute } from "@/lib/is-story-play-route";
import styles from "./KidsPlayDock.module.css";

/** 內頁左下三入口：與行動抽屜同一批 emoji 與標籤。 */
const DOCK_LINKS = [
  { id: "stories", label: "全部故事", href: "/stories", emoji: "📖" },
  { id: "games", label: "遊樂園", href: "/games", emoji: "🎡" },
  { id: "adventures", label: "宇宙地圖", href: "/adventures", emoji: "🗺️" },
] as const;

/**
 * Dock 的 active 規則與頂欄不同：`/games` 僅精確匹配 hub，
 * 著色本等子路徑不得把「遊樂園」標成目前頁。
 */
export function isDockLinkActive(pathname: string, href: string): boolean {
  if (href === "/games") {
    return pathname === "/games";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function KidsPlayDock() {
  const pathname = usePathname();
  const dockRef = useRef<HTMLElement>(null);
  const [motionPaused, setMotionPaused] = useState(false);

  const hidden = pathname === "/" || isImmersiveRoute(pathname);

  // 分頁隱藏或捲出視窗時暫停按壓過渡，避免背景分頁仍跑 transform。
  useEffect(() => {
    if (hidden) return;

    const el = dockRef.current;
    if (!el) return;

    let inView = true;
    let pageVisible = document.visibilityState === "visible";

    const sync = () => setMotionPaused(!pageVisible || !inView);

    const onVisibility = () => {
      pageVisible = document.visibilityState === "visible";
      sync();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry?.isIntersecting ?? true;
        sync();
      },
      { threshold: 0 },
    );
    observer.observe(el);
    sync();

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      observer.disconnect();
    };
  }, [hidden]);

  if (hidden) return null;

  const onAdventuresWorld = pathname === "/adventures";
  const onAdventures =
    onAdventuresWorld || pathname.startsWith("/adventures/");
  const onPlayMapHub = pathname === "/for-parents/play-map";
  const flushPad = onAdventures || onPlayMapHub;

  return (
    <nav
      ref={dockRef}
      className={styles.dock}
      aria-label="去玩"
      data-kids-dock
      {...(flushPad ? { "data-kids-dock-flush": true } : {})}
      {...(onAdventuresWorld ? { "data-lift": "picker" } : {})}
      data-paused={motionPaused ? "true" : undefined}
    >
      <ul className={styles.list} role="list">
        {DOCK_LINKS.map((item) => {
          const active = isDockLinkActive(pathname, item.href);
          return (
            <li key={item.id} className={styles.item}>
              <Link
                href={item.href}
                className={styles.link}
                aria-current={active ? "page" : undefined}
              >
                <span className={styles.emoji} aria-hidden>
                  {item.emoji}
                </span>
                <span className={styles.label}>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
