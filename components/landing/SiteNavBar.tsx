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
import { visibleSocials } from "@/lib/social";
import styles from "./SiteNavBar.module.css";

type NavItemId =
  | "stories"
  | "characters"
  | "topic"
  | "games"
  | "coloring"
  | "adventures"
  | "parenting"
  | "for-parents";

type NavItem = {
  id: NavItemId;
  label: string;
  href: string;
  external?: boolean;
};

/** 桌面主列連結順序。
 * 成長主題（`topic`）屬家長取向且與 /stories 篩選重疊，桌面不佔主膠囊；
 * 仍保留於行動抽屜「探索」組與 `/topic` 視覺化頁。 */
const PRIMARY_ORDER: readonly NavItemId[] = [
  "stories",
  "characters",
  "games",
  "adventures",
  "parenting",
  "for-parents",
] as const;

/** 行動版家長組 id（分隔線落在「實際首個可見項」，避免 Threads 缺席時 groupStart 消失）。 */
const MOBILE_PARENT_GROUP_IDS = new Set<NavItemId>([
  "parenting",
  "for-parents",
]);

/** 行動版單欄：探索在前、家長組在後；lookup 一律用 id。 */
const MOBILE_MENU_ROWS: readonly {
  id: NavItemId;
  emoji: string;
}[] = [
  { id: "stories", emoji: "📖" },
  { id: "characters", emoji: "🚗" },
  // 調色盤給著色本：它才是美術活動。主題分類屬家長取向（見 DESIGN.md），改用種子。
  { id: "topic", emoji: "🌱" },
  { id: "games", emoji: "🎡" },
  // 著色本原本只能從遊樂園子頁進入；對不識字的兒童而言等於不存在。
  // 提到「探索」組與遊樂園並列（桌面主膠囊見 PRIMARY_ORDER）。
  { id: "coloring", emoji: "🎨" },
  { id: "adventures", emoji: "🗺️" },
  { id: "parenting", emoji: "✏️" },
  { id: "for-parents", emoji: "🧭" },
] as const;

function navItems(): NavItem[] {
  const threads = visibleSocials().find((s) => s.icon === "threads");

  // 全站一致的次級導覽；filter／key 一律用穩定 id。
  const items: NavItem[] = [
    { id: "stories", label: "全部故事", href: "/stories" },
    { id: "characters", label: "角色圖鑑", href: "/characters" },
    { id: "topic", label: "主題分類", href: "/topic" },
    { id: "games", label: "遊樂園", href: "/games" },
    { id: "coloring", label: "繪本著色", href: "/games/coloring-book" },
    { id: "adventures", label: "宇宙地圖", href: "/adventures" },
    { id: "for-parents", label: "家長指南", href: "/for-parents" },
  ];
  if (threads?.url) {
    items.push({
      id: "parenting",
      label: "育兒專欄",
      href: threads.url,
      external: true,
    });
  }
  return items;
}

function externalProps(item: NavItem) {
  return item.external
    ? { target: "_blank" as const, rel: "noopener noreferrer" }
    : {};
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
    .filter((item) => !item.external && item.href.startsWith("/"))
    .map((item) => item.href);
  const primaryItems = PRIMARY_ORDER.map((id) => byId.get(id)).filter(
    (item): item is NavItem => item !== undefined,
  );

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
            const active = isInternalPathActive(pathname, item.href, internalHrefs);
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
                    <span>{item.label}</span>
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
