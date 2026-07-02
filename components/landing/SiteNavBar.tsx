"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import ThemeModeSwitch from "@/components/ThemeModeSwitch";
import SubscribeMenu from "@/components/landing/SubscribeMenu";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { isStoryPlayRoute } from "@/lib/is-story-play-route";
import { visibleSocials } from "@/lib/social";
import styles from "./SiteNavBar.module.css";

function navItems() {
  const threads = visibleSocials().find((s) => s.icon === "threads");
  const contact =
    process.env.NEXT_PUBLIC_CONTACT_FORM_URL?.trim() ||
    "mailto:bonboncarstory@gmail.com";
  const contactExternal = /^https?:/i.test(contact);

  // 全站一致的次級導覽：每頁都能直達主要分區（故事 / 主題 / 宇宙地圖 / 遊樂園 / 關於）。
  const items: { label: string; href: string; external?: boolean }[] = [
    { label: "全部故事", href: "/stories" },
    { label: "家長指南", href: "/for-parents" },
    { label: "主題分類", href: "/topic" },
    { label: "宇宙地圖", href: "/adventures" },
    { label: "遊樂園", href: "/games" },
    { label: "關於我們", href: "/about" },
  ];
  if (threads?.url) {
    items.push({ label: "育兒專欄 · Threads", href: threads.url, external: true });
  }
  items.push({ label: "聯絡我們", href: contact, external: contactExternal });
  return items;
}

export default function SiteNavBar() {
  const pathname = usePathname();
  const playMode = isStoryPlayRoute(pathname);
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const items = navItems();

  useFocusTrap(open, panelRef);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (playMode) return null;

  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mascot.png" alt="" width={36} height={28} aria-hidden />
          <span className={styles.brandText}>車車遊樂園</span>
        </Link>

        <div className={styles.actions}>
          <SubscribeMenu />

          <button
            type="button"
            className={styles.menuBtn}
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? "關閉選單" : "開啟選單"}
            onClick={() => setOpen((v) => !v)}
          >
            <span className={styles.menuIcon} aria-hidden />
          </button>
        </div>
      </div>

      {open ? (
        <nav
          id={menuId}
          ref={panelRef}
          className={styles.panel}
          aria-label="網站選單"
        >
          <ul className={styles.list}>
            {items.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={styles.link}
                  onClick={() => setOpen(false)}
                  {...("external" in item && item.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className={styles.themeRow}>
            <span className={styles.themeLabel}>主題模式</span>
            <ThemeModeSwitch />
          </div>
        </nav>
      ) : null}
    </header>
  );
}
