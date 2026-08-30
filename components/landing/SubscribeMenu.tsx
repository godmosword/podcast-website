"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { BrandSvg, PLATFORM_ICON_PATHS } from "@/lib/connect-icons";
import { trackPlatformClick } from "@/lib/analytics";
import { appendPlatformUtm } from "@/lib/platform-utm";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { visiblePlatforms } from "@/lib/platforms";
import styles from "./SubscribeMenu.module.css";

/** 受控開闔：由 `SiteNavBar` 統一管理，確保同時只有一個浮層開著
 * （兩個 focus trap 同時 active 會互搶 Tab）。
 *
 * `open` 與 `onOpenChange` **必須成對**——只傳 `open` 會讓觸發器呼叫 setter
 * 卻永遠改不動受控值（半受控陷阱）；型別層直接禁止該組合。 */
type SubscribeMenuProps =
  | { open: boolean; onOpenChange: (open: boolean) => void }
  | { open?: undefined; onOpenChange?: undefined };

export default function SubscribeMenu({
  open: controlledOpen,
  onOpenChange,
}: SubscribeMenuProps = {}) {
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
  const platforms = visiblePlatforms();

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

  // 平台清單為空時**不得整顆消失**——頂欄「訂閱」是版面契約，退為站內 /subscribe。
  if (platforms.length === 0) {
    return (
      <Link href="/subscribe" className={styles.trigger}>
        訂閱
      </Link>
    );
  }

  if (platforms.length === 1) {
    const platform = platforms[0]!;
    return (
      <a
        href={appendPlatformUtm(platform.url, { source: "nav-bar" })}
        className={styles.trigger}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackPlatformClick(platform.label, "nav-bar")}
      >
        訂閱
      </a>
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
        訂閱
        <span className={styles.chevron} aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <ul id={menuId} ref={dropdownRef} className={styles.dropdown} role="menu">
          {platforms.map((platform) => (
            <li key={platform.label} role="none">
              <a
                href={appendPlatformUtm(platform.url, { source: "nav-dropdown" })}
                className={styles.option}
                role="menuitem"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  trackPlatformClick(platform.label, "nav-dropdown");
                  setOpen(false);
                }}
              >
                <span
                  className={styles.badge}
                  style={{ background: platform.color }}
                >
                  <BrandSvg className={styles.icon}>
                    {PLATFORM_ICON_PATHS[platform.icon]}
                  </BrandSvg>
                </span>
                <span className={styles.label}>{platform.label}</span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
