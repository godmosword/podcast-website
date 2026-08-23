"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import ThemeModeSwitch from "@/components/ThemeModeSwitch";
import ThemeToggle from "@/components/ThemeToggle";
import SubscribeMenu from "@/components/landing/SubscribeMenu";
import Icon from "@/components/ui/Icon";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useLandingFooterNavSolid } from "@/hooks/useLandingFooterNavSolid";
import { isImmersiveRoute } from "@/lib/is-story-play-route";
import styles from "./SiteNavBar.module.css";

type NavItemId =
  | "stories"
  | "characters"
  | "games"
  | "coloring"
  | "adventures"
  | "for-parents"
  | "play-map";

type NavItem = {
  id: NavItemId;
  label: string;
  href: string;
};

/** 桌面主列連結順序。
 * 成長主題（`/topic`）屬家長取向且與 /stories 篩選重疊，導覽（桌面＋行動）都不佔位；
 * 頁面仍可直達。繪本著色僅行動抽屜獨立列出（兒童動線）。
 * 「親子景點」與「親子指南」並列於主列（CRITICAL-R A：路徑仍為 `/for-parents/play-map`）。 */
const PRIMARY_ORDER: readonly NavItemId[] = [
  "stories",
  "characters",
  "games",
  "adventures",
  "play-map",
  "for-parents",
] as const;

/** 行動版家長組 id（分隔線落在「實際首個可見項」）。 */
const MOBILE_PARENT_GROUP_IDS = new Set<NavItemId>(["for-parents", "play-map"]);

/** 行動版單欄：探索在前、家長組在後；lookup 一律用 id。 */
const MOBILE_MENU_ROWS: readonly {
  id: NavItemId;
  emoji: string;
}[] = [
  { id: "stories", emoji: "📖" },
  { id: "characters", emoji: "🚗" },
  { id: "games", emoji: "🎡" },
  // 著色本原本只能從遊樂園子頁進入；對不識字的兒童而言等於不存在。
  // 提到「探索」組與遊樂園並列（桌面主膠囊見 PRIMARY_ORDER）。
  { id: "coloring", emoji: "🎨" },
  { id: "adventures", emoji: "🗺️" },
  { id: "for-parents", emoji: "🧭" },
  { id: "play-map", emoji: "📍" },
] as const;

function navItems(): NavItem[] {
  // 全站一致的次級導覽；filter／key 一律用穩定 id。
  // Threads 育兒分享改由 /for-parents 頁內區塊承接，不再佔導覽。
  return [
    { id: "stories", label: "全部故事", href: "/stories" },
    { id: "characters", label: "角色圖鑑", href: "/characters" },
    { id: "games", label: "遊樂園", href: "/games" },
    { id: "coloring", label: "繪本著色", href: "/games/coloring-book" },
    { id: "adventures", label: "宇宙地圖", href: "/adventures" },
    { id: "for-parents", label: "親子指南", href: "/for-parents" },
    { id: "play-map", label: "親子景點", href: "/for-parents/play-map" },
  ];
}

function matchesPath(pathname: string, href: string): boolean {
  return href.startsWith("/") && (pathname === href || pathname.startsWith(`${href}/`));
}

/**
 * 最長匹配獨佔 active。`/games/coloring-book` 同時被 `/games` 與著色本自身命中，
 * 若不排除會出現兩個高亮與兩個 `aria-current="page"`。
 */
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

export default function SiteNavBar() {
  const pathname = usePathname();
  const playMode = isImmersiveRoute(pathname);
  const menuId = useId();
  const searchId = useId();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const items = navItems();
  const byId = new Map(items.map((item) => [item.id, item]));
  // 供 active 判定做最長匹配（如 /games 與 /games/coloring-book 互斥）
  const internalHrefs = items
    .filter((item) => item.href.startsWith("/"))
    .map((item) => item.href);
  const primaryItems = PRIMARY_ORDER.map((id) => byId.get(id)).filter(
    (item): item is NavItem => item !== undefined,
  );
  // 桌面主列含 play-map；最長匹配使 /for-parents/play-map 獨佔「親子景點」
  const primaryHrefs = primaryItems.map((item) => item.href);

  useFocusTrap(open, panelRef, { initialFocus: "container" });

  const onLandingHome = pathname === "/";
  const navSolid = useLandingFooterNavSolid(onLandingHome);

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
    <header
      className={styles.bar}
      {...(open ? { "data-menu-open": "true" as const } : {})}
      {...(navSolid ? { "data-nav-solid": "true" as const } : {})}
    >
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mascot.png" alt="" width={36} height={28} aria-hidden />
          <span className={styles.brandText}>車車遊樂園</span>
        </Link>

        {/* 桌面：主列依 PRIMARY_ORDER（無「更多」） */}
        <nav className={styles.desktopNav} aria-label="主要分區">
          {primaryItems.map((item) => {
            const active = isInternalPathActive(pathname, item.href, primaryHrefs);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
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
            <button type="submit" className={styles.searchSubmit}>
              搜尋
            </button>
          </form>

          <ul className={styles.menuList}>
            {(() => {
              const firstParentId = MOBILE_MENU_ROWS.find(
                (r) => MOBILE_PARENT_GROUP_IDS.has(r.id) && byId.has(r.id),
              )?.id;
              return MOBILE_MENU_ROWS.map((row) => {
              const item = byId.get(row.id);
              if (!item) return null;
              const active = isInternalPathActive(pathname, item.href, internalHrefs);
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
                    onClick={() => setOpen(false)}
                  >
                    <span className={styles.menuEmoji} aria-hidden>
                      {row.emoji}
                    </span>
                    <span>{item.label}</span>
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
