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

type NavItemId =
  | "stories"
  | "topic"
  | "games"
  | "adventures"
  | "parenting"
  | "for-parents"
  | "about"
  | "contact";

type NavItem = {
  id: NavItemId;
  label: string;
  href: string;
  external?: boolean;
};

/** 桌面主列連結順序（家長指南為下拉 trigger，不在此陣列）。
 * 成長主題（`topic`）屬家長取向且與 /stories 篩選重疊，桌面不佔主膠囊；
 * 仍保留於行動抽屜「探索」組與 `/topic` 視覺化頁。 */
const PRIMARY_ORDER: readonly NavItemId[] = [
  "stories",
  "games",
  "adventures",
  "parenting",
] as const;

/** 家長指南下拉項（文案由 navItems 決定；for-parents 顯示「指南首頁」）。 */
const PARENT_DROPDOWN_IDS: readonly NavItemId[] = [
  "for-parents",
  "about",
  "contact",
] as const;

/** 行動版家長組 id（分隔線落在「實際首個可見項」，避免 Threads 缺席時 groupStart 消失）。 */
const MOBILE_PARENT_GROUP_IDS = new Set<NavItemId>([
  "parenting",
  "for-parents",
  "about",
  "contact",
]);

/** 行動版單欄：探索在前、家長組在後；lookup 一律用 id。 */
const MOBILE_MENU_ROWS: readonly {
  id: NavItemId;
  emoji: string;
}[] = [
  { id: "stories", emoji: "📖" },
  { id: "topic", emoji: "🎨" },
  { id: "games", emoji: "🎡" },
  { id: "adventures", emoji: "🗺️" },
  { id: "parenting", emoji: "✏️" },
  { id: "for-parents", emoji: "🧭" },
  { id: "about", emoji: "🚙" },
  { id: "contact", emoji: "✉️" },
] as const;

function navItems(): NavItem[] {
  const threads = visibleSocials().find((s) => s.icon === "threads");
  const contact =
    process.env.NEXT_PUBLIC_CONTACT_FORM_URL?.trim() ||
    "mailto:bonboncarstory@gmail.com";
  const contactExternal = /^https?:/i.test(contact);

  // 全站一致的次級導覽；filter／key 一律用穩定 id。
  const items: NavItem[] = [
    { id: "stories", label: "全部故事", href: "/stories" },
    { id: "topic", label: "主題分類", href: "/topic" },
    { id: "games", label: "遊樂園", href: "/games" },
    { id: "adventures", label: "宇宙地圖", href: "/adventures" },
    // 下拉首項：顯示「指南首頁」；行動列另行覆寫為「家長指南」
    { id: "for-parents", label: "指南首頁", href: "/for-parents" },
    { id: "about", label: "關於我們", href: "/about" },
  ];
  if (threads?.url) {
    items.push({
      id: "parenting",
      label: "育兒專欄",
      href: threads.url,
      external: true,
    });
  }
  items.push({
    id: "contact",
    label: "聯絡我們",
    href: contact,
    external: contactExternal,
  });
  return items;
}

function externalProps(item: NavItem) {
  return item.external
    ? { target: "_blank" as const, rel: "noopener noreferrer" }
    : {};
}

function isInternalPathActive(pathname: string, href: string): boolean {
  return href.startsWith("/") && (pathname === href || pathname.startsWith(`${href}/`));
}

/** 家長路徑是否應標 trigger active（聯絡為 mailto／外連，無站內 path）。 */
function isParentPathActive(pathname: string): boolean {
  return (
    isInternalPathActive(pathname, "/for-parents") ||
    isInternalPathActive(pathname, "/about")
  );
}

/** 家長指南下拉（button + menu、Esc／外點；不套用 focus trap）。 */
function ParentGuideDropdown({
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
  const triggerActive = isParentPathActive(pathname);

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
    <div ref={wrapRef} className={styles.parentDropdown}>
      <button
        type="button"
        className={`${styles.parentDropdownBtn} ${triggerActive ? styles.parentDropdownBtnActive : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        家長指南
        <Icon
          name="chevron-right"
          size={14}
          className={`${styles.parentDropdownChev} ${open ? styles.parentDropdownChevOpen : ""}`}
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
                key={item.id}
                role="menuitem"
                href={item.href}
                className={styles.dropdownLink}
                aria-current={isInternalPathActive(pathname, item.href) ? "page" : undefined}
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
  const byId = new Map(items.map((item) => [item.id, item]));
  const primaryItems = PRIMARY_ORDER.map((id) => byId.get(id)).filter(
    (item): item is NavItem => item !== undefined,
  );
  const parentDropdownItems = PARENT_DROPDOWN_IDS.map((id) => byId.get(id)).filter(
    (item): item is NavItem => item !== undefined,
  );

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

        {/* 桌面：主列依 PRIMARY_ORDER＋家長指南下拉（無「更多」） */}
        <nav className={styles.desktopNav} aria-label="主要分區">
          {primaryItems.map((item) => {
            const active = isInternalPathActive(pathname, item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
                aria-current={active ? "page" : undefined}
                aria-label={
                  item.id === "parenting" ? "育兒專欄（Threads，另開視窗）" : undefined
                }
                {...externalProps(item)}
              >
                {item.label}
                {item.external ? (
                  <Icon name="external" size={13} className={styles.extIcon} />
                ) : null}
              </Link>
            );
          })}
          <ParentGuideDropdown items={parentDropdownItems} pathname={pathname} />
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
            {(() => {
              const firstParentId = MOBILE_MENU_ROWS.find(
                (r) => MOBILE_PARENT_GROUP_IDS.has(r.id) && byId.has(r.id),
              )?.id;
              return MOBILE_MENU_ROWS.map((row) => {
              const item = byId.get(row.id);
              if (!item) return null;
              // 行動：for-parents 顯示「家長指南」（桌面下拉則為「指南首頁」）
              const displayLabel =
                row.id === "for-parents" ? "家長指南" : item.label;
              const active = isInternalPathActive(pathname, item.href);
              return (
                <li
                  key={item.id}
                  className={
                    row.id === firstParentId ? styles.menuGroupStart : undefined
                  }
                >
                  <Link
                    href={item.href}
                    className={styles.menuLink}
                    aria-current={active ? "page" : undefined}
                    aria-label={
                      row.id === "parenting"
                        ? "育兒專欄（Threads，另開視窗）"
                        : undefined
                    }
                    onClick={() => setOpen(false)}
                    {...externalProps(item)}
                  >
                    <span className={styles.menuEmoji} aria-hidden>
                      {row.emoji}
                    </span>
                    <span>{displayLabel}</span>
                    {item.external ? (
                      <Icon name="external" size={13} className={styles.extIcon} />
                    ) : null}
                  </Link>
                </li>
              );
              });
            })()}
          </ul>

          <div className={styles.themeSlot}>
            <ThemeToggle compact />
          </div>
        </nav>
      ) : null}
    </header>
  );
}
