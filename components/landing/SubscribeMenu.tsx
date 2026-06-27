"use client";

import { useEffect, useId, useRef, useState } from "react";
import { BrandSvg, PLATFORM_ICON_PATHS } from "@/lib/connect-icons";
import { trackPlatformClick } from "@/lib/analytics";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { visiblePlatforms } from "@/lib/platforms";
import styles from "./SubscribeMenu.module.css";

type SubscribeMenuProps = {
  /** 播放器全螢幕模式：縮小按鈕、縮短文案，避免遮到播放器控制列。 */
  compact?: boolean;
};

export default function SubscribeMenu({ compact = false }: SubscribeMenuProps) {
  const menuId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
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
  }, [open]);

  if (platforms.length === 0) return null;

  const triggerClass = compact
    ? `${styles.trigger} ${styles.triggerCompact}`
    : styles.trigger;
  const triggerLabel = compact ? "訂閱" : "訂閱收聽";

  if (platforms.length === 1) {
    const platform = platforms[0]!;
    return (
      <a
        href={platform.url}
        className={triggerClass}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackPlatformClick(platform.label, "nav-bar")}
      >
        {triggerLabel}
      </a>
    );
  }

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={triggerClass}
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        {triggerLabel}
        <span className={styles.chevron} aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <ul id={menuId} ref={dropdownRef} className={styles.dropdown} role="menu">
          {platforms.map((platform) => (
            <li key={platform.label} role="none">
              <a
                href={platform.url}
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
