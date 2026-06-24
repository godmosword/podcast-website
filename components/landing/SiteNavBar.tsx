"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import ThemeModeSwitch from "@/components/ThemeModeSwitch";
import { visibleSocials } from "@/lib/social";
import { visiblePlatforms } from "@/lib/platforms";
import styles from "./SiteNavBar.module.css";

function navItems() {
  const threads = visibleSocials().find((s) => s.icon === "threads");
  const contact =
    process.env.NEXT_PUBLIC_CONTACT_FORM_URL?.trim() ||
    "mailto:bonboncarstory@gmail.com";
  const contactExternal = /^https?:/i.test(contact);

  const items: { label: string; href: string; external?: boolean }[] = [
    { label: "全部故事", href: "/stories" },
    { label: "關於我們", href: "/about" },
  ];
  if (threads?.url) {
    items.push({ label: "育兒專欄 · Threads", href: threads.url, external: true });
  }
  items.push({ label: "聯絡我們", href: contact, external: contactExternal });
  return items;
}

export default function SiteNavBar() {
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const items = navItems();
  const subscribe = visiblePlatforms()[0];

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mascot.png" alt="" width={36} height={28} aria-hidden />
          <span className={styles.brandText}>車車遊樂園</span>
        </Link>

        <div className={styles.actions}>
          {subscribe ? (
            <a
              href={subscribe.url}
              className={styles.subscribe}
              target="_blank"
              rel="noopener noreferrer"
            >
              訂閱收聽
            </a>
          ) : null}

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
        <nav id={menuId} className={styles.panel} aria-label="網站選單">
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
