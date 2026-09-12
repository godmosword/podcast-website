"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { BrandSvg, PLATFORM_ICON_PATHS, SOCIAL_ICON_PATHS } from "@/lib/connect-icons";
import { trackPlatformClick } from "@/lib/analytics";
import { appendPlatformUtm } from "@/lib/platform-utm";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { visiblePlatforms } from "@/lib/platforms";
import { visibleNavSocials } from "@/lib/social";
import styles from "./SubscribeMenu.module.css";

/** 受控開闔：由 `SiteNavBar` 統一管理，確保同時只有一個浮層開著
 * （兩個 focus trap 同時 active 會互搶 Tab）。
 *
 * `open` 與 `onOpenChange` **必須成對**——只傳 `open` 會讓觸發器呼叫 setter
 * 卻永遠改不動受控值（半受控陷阱）；型別層直接禁止該組合。 */
type ConnectMenuProps = {
  kind: "channels" | "socials";
} & (
  | { open: boolean; onOpenChange: (open: boolean) => void }
  | { open?: undefined; onOpenChange?: undefined }
);

type ConnectItem = {
  key: string;
  label: string;
  href: string;
  ariaLabel: string;
  badgeStyle?: CSSProperties;
  icon: ReactNode;
  onSelect?: () => void;
};

function connectItemsFor(kind: "channels" | "socials"): ConnectItem[] {
  if (kind === "channels") {
    return visiblePlatforms().map((platform) => ({
      key: platform.label,
      label: platform.label,
      href: appendPlatformUtm(platform.url, { source: "nav-dropdown" }),
      ariaLabel: `在 ${platform.label} 收聽`,
      badgeStyle: { background: platform.color },
      icon: (
        <BrandSvg className={styles.icon}>
          {PLATFORM_ICON_PATHS[platform.icon]}
        </BrandSvg>
      ),
      onSelect: () => trackPlatformClick(platform.label, "nav-dropdown"),
    }));
  }
  return visibleNavSocials().map((social) => ({
    key: social.label,
    label: social.label,
    href: social.url,
    ariaLabel: `前往 ${social.label}`,
    badgeStyle: { background: social.background },
    icon: (
      <BrandSvg className={styles.icon}>{SOCIAL_ICON_PATHS[social.icon]}</BrandSvg>
    ),
  }));
}

/** 頂欄頻道／社群下拉。檔名沿用 SubscribeMenu：樣式契約與 ≤480 錨點測仍綁這份 CSS。 */
export default function ConnectMenu({
  kind,
  open: controlledOpen,
  onOpenChange,
}: ConnectMenuProps) {
  const menuId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );
  const items = connectItemsFor(kind);
  const label = kind === "channels" ? "頻道" : "社群";

  useFocusTrap(open, dropdownRef);

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
  }, [open, setOpen]);

  if (items.length === 0) {
    // 頻道是版面契約，清單空時不得整顆消失，退為站內 /subscribe。
    // 社群沒有對等的站內頁，空清單就不渲染。
    if (kind === "socials") return null;
    return (
      <Link href="/subscribe" className={styles.trigger}>
        {label}
      </Link>
    );
  }

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        onClick={() => setOpen(!open)}
      >
        {label}
        <span className={styles.chevron} aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <ul id={menuId} ref={dropdownRef} className={styles.dropdown} role="menu">
          {items.map((item) => {
            const opensNewTab =
              item.href.startsWith("http://") || item.href.startsWith("https://");
            return (
              <li key={item.key} role="none">
                <a
                  href={item.href}
                  className={styles.option}
                  role="menuitem"
                  aria-label={item.ariaLabel}
                  {...(opensNewTab
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  onClick={() => {
                    item.onSelect?.();
                    setOpen(false);
                  }}
                >
                  <span className={styles.badge} style={item.badgeStyle}>
                    {item.icon}
                  </span>
                  <span className={styles.label}>{item.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
