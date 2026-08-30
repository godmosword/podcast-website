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
  | "for-parents"
  | "play-map"
  | "feedback";

type NavItem = {
  id: NavItemId;
  label: string;
  href: string;
};

/** 抽屜家長組 id（小標「給爸媽」落在實際首個可見項）。 */
const MOBILE_PARENT_GROUP_IDS = new Set<NavItemId>([
  "for-parents",
  "play-map",
]);

/** 抽屜：探索 → 家長（7 列；首頁在頂欄、留言在頂欄 .actions）。 */
const MENU_ROWS: readonly {
  id: NavItemId;
  emoji: string;
}[] = [
  { id: "stories", emoji: "📖" },
  { id: "characters", emoji: "🚗" },
  { id: "games", emoji: "🎡" },
  // 著色本原本只能從遊樂園子頁進入；對不識字的兒童而言等於不存在。
  { id: "coloring", emoji: "🎨" },
  { id: "adventures", emoji: "🗺️" },
  { id: "for-parents", emoji: "🧭" },
  { id: "play-map", emoji: "📍" },
] as const;

/** 桌面常駐主列的斷點，與 CSS `@media (min-width: 980px)` 必須一致。 */
const DESKTOP_QUERY = "(min-width: 980px)";

function navItems(): NavItem[] {
  // 全站一致的次級導覽；filter／key 一律用穩定 id。
  return [
    { id: "home", label: "首頁", href: "/" },
    { id: "stories", label: "全部故事", href: "/stories" },
    { id: "characters", label: "角色圖鑑", href: "/characters" },
    { id: "games", label: "遊樂園", href: "/games" },
    { id: "coloring", label: "繪本著色", href: "/games/coloring-book" },
    { id: "adventures", label: "宇宙地圖", href: "/adventures" },
    { id: "for-parents", label: "親子指南", href: "/for-parents" },
    { id: "play-map", label: "親子景點", href: "/for-parents/play-map" },
    { id: "feedback", label: "留言", href: feedbackHref() },
  ];
}

function matchesPath(pathname: string, href: string): boolean {
  return href.startsWith("/") && (pathname === href || pathname.startsWith(`${href}/`));
}

/**
 * 最長匹配獨佔 active。`/games/coloring-book` 同時被 `/games` 與著色本自身命中，
 * 若不排除會出現兩個高亮與兩個 `aria-current="page"`。
 *
 * `href="/"` 不需特判：`matchesPath("/x", "/")` 比對的是 `"//"`，不會全站誤命中。
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

/** 頂欄「留言」：與抽屜外連分支同一套規則（非 `/` 不走 next/link）。 */
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

/** 同時只允許一個浮層開著——兩個 focus trap 同時 active 會互搶 Tab。 */
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
  // 供 active 判定做最長匹配（如 /games 與 /games/coloring-book 互斥）
  const internalHrefs = items
    .filter((item) => item.href.startsWith("/"))
    .map((item) => item.href);
  const feedbackItem = byId.get("feedback");

  useFocusTrap(open, panelRef, { initialFocus: "first" });

  const onLandingHome = pathname === "/";
  const navSolid = useLandingFooterNavSolid(onLandingHome);

  const closeAll = useCallback(() => setOpenMenu("none"), []);

  /** 點浮層外部關閉：`pointerdown` 早於 `click`，若讓 focus trap 把焦點歸還觸發器，
   * 會從使用者正要點的元素手上搶走。先把焦點移出面板再關，trap 的歸還就不會生效
   * （`previouslyFocused.focus()` 仍會執行，但此時使用者的點擊會在其後接手）。 */
  const closeFromOutside = useCallback(() => {
    (document.activeElement as HTMLElement | null)?.blur?.();
    setOpenMenu("none");
  }, []);

  // Esc 關閉
  useEffect(() => {
    if (openMenu === "none") return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeAll();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openMenu, closeAll]);

  // 點浮層外部關閉（與 SubscribeMenu 行為一致；原本只有訂閱有）
  useEffect(() => {
    if (openMenu === "none") return;
    function onPointerDown(e: PointerEvent) {
      if (!barRef.current?.contains(e.target as Node)) closeFromOutside();
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [openMenu, closeFromOutside]);

  // 跨越桌面斷點時關閉抽屜。舊碼在 979→980 會留下 open=true 卻不可見的面板，
  // focus trap 抓到空陣列、焦點掉到 body，且 data-menu-open 卡住。
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

    // 非站內路徑（留言可能是 mailto 或外部表單）不走 next/link 預抓
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
      {...(open ? { "data-menu-open": "true" as const } : {})}
      {...(navSolid ? { "data-nav-solid": "true" as const } : {})}
    >
      <div className={styles.inner}>
        {/* 不加 aria-label：可見字標即可及名稱，加了會覆寫並破壞既有 e2e 契約 */}
        <Link href="/" className={styles.brand} onClick={closeAll}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mascot.png" alt="" width={36} height={28} aria-hidden />
          <span className={styles.brandText}>車車遊樂園</span>
        </Link>

        {/* 觸發器緊接品牌右側（非最右），與品牌之間留出視覺區隔 */}
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
          {/* icon-only 觸發器辨識度差；帶可見文字。不用「更多」——語意空洞且撞規範 */}
          <span className={styles.menuBtnText}>選單</span>
        </button>

        <div className={styles.actions} role="group" aria-label="常用">
          {/* 兩斷點同構：首頁文字入口（窄屏品牌字 sr-only 後仍有一個可見「回家」詞） */}
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

        {/* 抽屜連結**常駐 DOM**、以 CSS `display: none` 隱藏：`{open && …}` 會讓
            關閉態的 server HTML 完全沒有站內連結。常駐後 HTML 一定含這些連結
            （搜尋引擎是否採計 hidden link 由它決定，這裡只保證連結存在）。
            關閉時另加 `inert`：`display: none` 已排除聚焦與 AT，`inert` 是
            防止日後有人把隱藏手法改成 opacity／visibility 時破口重開的保險。
            **必須是 `.inner` 的子節點**——`.inner` 有 `container-type: inline-size`
            （即 containing block），放在外面會改錨定到 `.bar`，桌面就變全寬下拉。 */}
        <nav
          id={menuId}
          ref={panelRef}
          className={styles.panel}
          aria-label="網站選單"
          data-open={open ? "true" : "false"}
          {...(open ? {} : { inert: true })}
        >
          {/* 兩個 list：`list-style: none` 在 Safari/VoiceOver 會移除清單語意，
            故顯式 `role="list"`；家長組另以 `aria-labelledby` 綁小標，
            讓 AT 拿到與視覺分組對等的語意（磁貼牆同一作法）。 */}
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
