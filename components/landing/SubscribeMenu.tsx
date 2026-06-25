"use client";

import { useEffect, useId, useRef, useState } from "react";
import { BrandSvg, PLATFORM_ICON_PATHS } from "@/lib/connect-icons";
import { trackPlatformClick } from "@/lib/analytics";
import { visiblePlatforms } from "@/lib/platforms";
import styles from "./SubscribeMenu.module.css";

export default function SubscribeMenu() {
  const menuId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const platforms = visiblePlatforms();

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

  if (platforms.length === 1) {
    const platform = platforms[0]!;
    return (
      <a
        href={platform.url}
        className={styles.trigger}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackPlatformClick(platform.label, "nav-bar")}
      >
        訂閱收聽
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
        onClick={() => setOpen((v) => !v)}
      >
        訂閱收聽
        <span className={styles.chevron} aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <ul id={menuId} className={styles.dropdown} role="menu">
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
