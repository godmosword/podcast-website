"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import ThemeModeSwitch from "@/components/ThemeModeSwitch";
import ThemeToggle from "@/components/ThemeToggle";
import SubscribeMenu from "@/components/landing/SubscribeMenu";
import Icon from "@/components/ui/Icon";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { isStoryPlayRoute } from "@/lib/is-story-play-route";
import { visibleSocials } from "@/lib/social";
import styles from "./SiteNavBar.module.css";

type NavItem = { label: string; href: string; external?: boolean };

/** 桌面膠囊列的四個主要項；其餘進「更多」下拉（1c 設計）。 */
const PRIMARY_LABELS = new Set(["全部故事", "主題分類", "遊樂園", "家長指南"]);

/** 行動版單欄清單：探索 4 項在前、家長 4 項在後，emoji 當視覺錨點。 */
const MOBILE_MENU_ROWS = [
  { label: "全部故事", emoji: "📖" },
  { label: "主題分類", emoji: "🎨" },
  { label: "遊樂園", emoji: "🎡" },
  { label: "宇宙地圖", emoji: "🗺️" },
  { label: "家長指南", emoji: "🧭", groupStart: true },
  { label: "育兒專欄 · Threads", emoji: "✏️" },
  { label: "關於我們", emoji: "🚙" },
  { label: "聯絡我們", emoji: "✉️" },
] as const;

function navItems(): NavItem[] {
  const threads = visibleSocials().find((s) => s.icon === "threads");
  const contact =
    process.env.NEXT_PUBLIC_CONTACT_FORM_URL?.trim() ||
    "mailto:bonboncarstory@gmail.com";
  const contactExternal = /^https?:/i.test(contact);

  // 全站一致的次級導覽：每頁都能直達主要分區（故事 / 主題 / 宇宙地圖 / 遊樂園 / 關於）。
  const items: NavItem[] = [
    { label: "全部故事", href: "/stories" },
    { label: "主題分類", href: "/topic" },
    { label: "遊樂園", href: "/games" },
    { label: "家長指南", href: "/for-parents" },
    { label: "宇宙地圖", href: "/adventures" },
    { label: "關於我們", href: "/about" },
  ];
  if (threads?.url) {
    items.push({ label: "育兒專欄 · Threads", href: threads.url, external: true });
  }
  items.push({ label: "聯絡我們", href: contact, external: contactExternal });
  return items;
}

function externalProps(item: NavItem) {
  return item.external
    ? { target: "_blank" as const, rel: "noopener noreferrer" }
    : {};
}

/** 桌面「更多」下拉：外部點擊與 Esc 關閉（與 SubscribeMenu 同手勢）。 */
function MoreDropdown({
  items,
  pathname,
}: {
  items: NavItem[];
  pathname: string;
}) {
  const menuId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className={styles.more}>
      <button
        type="button"
        className={styles.moreBtn}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        更多
        <Icon
          name="chevron-right"
          size={14}
          className={`${styles.moreChev} ${open ? styles.moreChevOpen : ""}`}
        />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            id={menuId}
            role="menu"
            className={styles.dropdown}
            initial={reducedMotion ? false : { opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              reducedMotion
                ? { opacity: 0, transition: { duration: 0 } }
                : { opacity: 0, y: -4, scale: 0.98 }
            }
            transition={{ type: "spring", duration: 0.28, bounce: 0.2 }}
          >
            {items.map((item) => (
              <Link
                key={item.label}
                role="menuitem"
                href={item.href}
                className={styles.dropdownLink}
                aria-current={pathname === item.href ? "page" : undefined}
                onClick={() => setOpen(false)}
                {...externalProps(item)}
              >
                {item.label}
                {item.external ? (
                  <Icon name="external" size={13} className={styles.extIcon} />
                ) : null}
              </Link>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default function SiteNavBar() {
  const pathname = usePathname();
  const playMode = isStoryPlayRoute(pathname);
  const menuId = useId();
  const searchId = useId();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const items = navItems();
  const primaryItems = items.filter((i) => PRIMARY_LABELS.has(i.label));
  const moreItems = items.filter((i) => !PRIMARY_LABELS.has(i.label));

  useFocusTrap(open, panelRef, { initialFocus: "container" });

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

        {/* 桌面（≥920px）：1c 膠囊內嵌主導覽＋更多下拉 */}
        <nav className={styles.desktopNav} aria-label="主要分區">
          {primaryItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
          <MoreDropdown items={moreItems} pathname={pathname} />
        </nav>

        <div className={styles.actions}>
          <span className={styles.themeDesktop}>
            <ThemeModeSwitch />
          </span>

          <SubscribeMenu />

          <button
            type="button"
            className={styles.menuBtn}
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? "關閉選單" : "開啟選單"}
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? "menu-close" : "menu"} size={20} />
          </button>
        </div>
      </div>

      {open ? (
        <nav
          id={menuId}
          ref={panelRef}
          className={styles.panel}
          aria-label="網站選單"
          tabIndex={-1}
        >
          <form
            className={styles.searchForm}
            action="/stories"
            method="get"
            onSubmit={() => setOpen(false)}
          >
            <label className="sr-only" htmlFor={searchId}>
              搜尋故事或主題
            </label>
            <input
              id={searchId}
              className={styles.searchInput}
              name="q"
              type="search"
              placeholder="搜尋故事或主題..."
              autoComplete="off"
            />
          </form>

          <ul className={styles.menuList}>
            {MOBILE_MENU_ROWS.map((row) => {
              const item = items.find((candidate) => candidate.label === row.label);
              if (!item) return null;
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li
                  key={item.label}
                  className={
                    "groupStart" in row && row.groupStart
                      ? styles.menuGroupStart
                      : undefined
                  }
                >
                  <Link
                    href={item.href}
                    className={styles.menuLink}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    {...externalProps(item)}
                  >
                    <span className={styles.menuEmoji} aria-hidden>
                      {row.emoji}
                    </span>
                    <span>{item.label}</span>
                    {item.external ? (
                      <Icon name="external" size={13} className={styles.extIcon} />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className={styles.themeSlot}>
            <ThemeToggle compact />
          </div>
        </nav>
      ) : null}
    </header>
  );
}
