"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import SubscribeMenu from "@/components/landing/SubscribeMenu";
import Icon from "@/components/ui/Icon";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useLandingFooterNavSolid } from "@/hooks/useLandingFooterNavSolid";
import { feedbackHref, isContactExternal } from "@/lib/contact";
import { isImmersiveRoute } from "@/lib/is-story-play-route";
import styles from "./SiteNavBar.module.css";

type NavItemId =
  | "home"
  | "stories"
  | "characters"
  | "games"
  | "coloring"
  | "adventures"
  | "about"
  | "for-parents"
  | "play-map"
  | "feedback";

type NavItem = {
  id: NavItemId;
  label: string;
  href: string;
};

/** 抽屆家長組 id（小標「給爸媽」落在實際首個可見項）。 */
const MOBILE_PARENT_GROUP_IDS = new Set<NavItemId>([
  "for-parents",
  "play-map",
]);

/** 抽屆：探索 → 家長（8 列；首頁在頂欄、留言在頂欄 .actions）。 */
const MENU_ROWS: readonly {
  id: NavItemId;
  emoji: string;
}[] = [
  { id: "stories", emoji: "📖" },
  { id: "characters", emoji: "🚗" },
  { id: "games", emoji: "🎡" },
  // 著色本原本只能從遊樂園子頁進入；對不識字的兒童而訙等於不存在。
  { id: "coloring", emoji: "🎨" },
  { id: "adventures", emoji: "🗺️" },
  { id: "about", emoji: "💛" },
  { id: "for-parents", emoji: "🧭" },
  { id: "play-map", emoji: "📍" },
] as const;

/** 桌面常駐主列的斷點，與 CSS `@media (min-width: 980px)` 必須一致。 */
const DESKTOP_QUERY = "(min-width: 980px)";

function navItems(): NavItem[] {
  return [
    { id: "home", label: "首頁", href: "/" },
    { id: "stories", label: "全部故事", href: "/stories" },
    { id: "characters", label: "角色圖鑑", href: "/characters" },
    { id: "games", label: "遊樂園", href: "/games" },
    { id: "coloring", label: "繪本著色", href: "/games/coloring-book" },
    { id: "adventures", label: "宇宙地圖", href: "/adventures" },
    { id: "about", label: "關於我們", href: "/about" },
    { id: "for-parents", label: "親子指南", href: "/for-parents" },
    { id: "play-map", label: "親子景點", href: "/for-parents/play-map" },
    { id: "feedback", label: "留言", href: feedbackHref() },
  ];
}

function matchesPath(pathname: string, href: string): boolean {
  return href.startsWith("/") && (pathname === href || pathname.startsWith(`${href}/`));
}

export function isInternalPathActive(
  pathname: string,
  href: string,
  siblings: readonly string[] = [],
): boolean {
  if (!matchesPath(pathname, href)) return false;
  return !siblings.some(
    (other) =>
      other.length > href.length && matchesPath(pathname, other),
  );
}

function renderFeedbackLink(
  href: string,
  label: string,
  className: string,
  onClose: () => void,
) {
  const external = isContactExternal(href);
  return (
    <a
      href={href}
      className={className}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onClick={onClose}
    >
      {label}
    </a>
  );
}

type OpenMenu = "none" | "subscribe" | "nav";

export default function SiteNavBar() {
  const pathname = usePathname();
  const playMode = isImmersiveRoute(pathname);
  const menuId = useId();
  const parentLabelId = useId();
  const [openMenu, setOpenMenu] = useState<OpenMenu>("none");
  const panelRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const open = openMenu === "nav";

  const items = navItems();
  const byId = new Map(items.map((item) => [item.id, item]));
  const internalHrefs = items
    .filter((item) => item.href.startsWith("/"))
    .map((item) => item.href);
  const feedbackItem = byId.get("feedback");

  useFocusTrap(open, panelRef, { initialFocus: "first" });

  const onLandingHome = pathname === "/";
  const navSolid = useLandingFooterNavSolid(onLandingHome);

  const closeAll = useCallback(() => setOpenMenu("none"), []);

  const closeFromOutside = useCallback(() => {
    (document.activeElement as HTMLElement | null)?.blur?.();
    setOpenMenu("none");
  }, []);

  useEffect(() => {
    if (openMenu === "none") return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeAll();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openMenu, closeAll]);

  useEffect(() => {
    if (openMenu === "none") return;
    function onPointerDown(e: PointerEvent) {
      if (!barRef.current?.contains(e.target as Node)) closeFromOutside();
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [openMenu, closeFromOutside]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => closeAll();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [closeAll]);

  if (playMode) return null;

  const exploreRows = MENU_ROWS.filter((r) => !MOBILE_PARENT_GROUP_IDS.has(r.id));
  const parentRows = MENU_ROWS.filter((r) => MOBILE_PARENT_GROUP_IDS.has(r.id));

  const renderRow = (row: (typeof MENU_ROWS)[number]) => {
    const item = byId.get(row.id);
    if (!item) return null;
    const active = isInternalPathActive(pathname, item.href, internalHrefs);
    const inner = (
      <>
        <span className={styles.menuEmoji} aria-hidden>
          {row.emoji}
        </span>
        <span>{item.label}</span>
      </>
    );

    if (!item.href.startsWith("/")) {
      const external = isContactExternal(item.href);
      return (
        <li key={item.id}>
          <a
            href={item.href}
            className={styles.menuLink}
            {...(external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            onClick={closeAll}
          >
            {inner}
          </a>
        </li>
      );
    }

    return (
      <li key={item.id}>
        <Link
          href={item.href}
          className={styles.menuLink}
          aria-current={active ? "page" : undefined}
          onClick={closeAll}
        >
          {inner}
        </Link>
      </li>
    );
  };

  return (
    <header
      ref={barRef}
      className={styles.bar}
      data-testid="site-nav-bar"
      {...(open ? { "data-menu-open": "true" as const } : {})}
      {...(navSolid ? { "data-nav-solid": "true" as const } : {})}
    >
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} onClick={closeAll}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mascot.png" alt="" width={36} height={28} aria-hidden />
          <span className={styles.brandText}>車車遊樂園</span>
        </Link>

        <div className={styles.actions} role="group" aria-label="常用">
          <Link
            href="/"
            className={`${styles.navLink} ${styles.homeAction}`}
            aria-current={
              isInternalPathActive(pathname, "/", internalHrefs)
                ? "page"
                : undefined
            }
            onClick={closeAll}
          >
            首頁
          </Link>
          <SubscribeMenu
            open={openMenu === "subscribe"}
            onOpenChange={(next) => setOpenMenu(next ? "subscribe" : "none")}
          />
          {feedbackItem
            ? renderFeedbackLink(
                feedbackItem.href,
                feedbackItem.label,
                styles.navLink,
                closeAll,
              )
            : null}
        </div>

        <button
          type="button"
          ref={menuBtnRef}
          className={styles.menuBtn}
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={open ? "關閉選單" : "開啟選單"}
          onClick={() => setOpenMenu(open ? "none" : "nav")}
        >
          <Icon name={open ? "menu-close" : "menu"} size={20} />
        </button>

        <nav
          id={menuId}
          ref={panelRef}
          className={styles.panel}
          aria-label="網站選單"
          data-open={open ? "true" : "false"}
          {...(open ? {} : { inert: true })}
        >
        <ul className={styles.menuList} role="list">
          {exploreRows.map((row) => renderRow(row))}
        </ul>

        <div className={styles.menuGroupStart}>
          <p id={parentLabelId} className={styles.menuGroupLabel}>
            給爸媽
          </p>
          <ul
            className={styles.menuList}
            role="list"
            aria-labelledby={parentLabelId}
          >
            {parentRows.map((row) => renderRow(row))}
          </ul>
        </div>

        <div className={styles.themeSlot}>
            <ThemeToggle compact />
          </div>
        </nav>
      </div>
    </header>
  );
}
