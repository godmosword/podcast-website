"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { playSfx } from "@/lib/sfx";
import styles from "./FilterSelect.module.css";

export type FilterSelectOption = {
  value: string;
  label: string;
  icon?: ReactNode;
};

type FilterSelectProps = {
  options: FilterSelectOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  listLabel: string;
  /** 圖示自帶底色（如 TopicIcon）時略過灰底 iconSlot */
  bareIcon?: boolean;
};

/** 共用下拉選單（車種／主題等篩選）。 */
export default function FilterSelect({
  options,
  value,
  onChange,
  ariaLabel,
  listLabel,
  bareIcon = false,
}: FilterSelectProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listId = `filter-list-${useId()}`;

  const current = options.find((o) => o.value === value) ?? options[0];

  const closeMenu = useCallback(() => {
    setOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) closeMenu();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeMenu();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [closeMenu, open]);

  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>('[data-active="true"]')
      ?.focus();
  }, [open]);

  function select(next: string) {
    playSfx("tap");
    onChange(next);
    closeMenu();
  }

  function onListKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const items = Array.from(
      listRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [],
    );
    const idx = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      items[Math.min(items.length - 1, idx + 1)]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      items[Math.max(0, idx - 1)]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      items[items.length - 1]?.focus();
    }
  }

  function renderIcon(icon: ReactNode) {
    if (bareIcon) {
      return (
        <span className={styles.iconBare} aria-hidden>
          {icon}
        </span>
      );
    }
    return (
      <span className={styles.iconSlot} aria-hidden>
        {icon}
      </span>
    );
  }

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.trigger}
        ref={triggerRef}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => {
          if (open) closeMenu();
          else setOpen(true);
        }}
      >
        <span className={styles.triggerInner}>
          {current.icon != null && renderIcon(current.icon)}
          <span className={styles.triggerLabel}>{current.label}</span>
        </span>
        <span className={styles.arrow} aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <div
          className={styles.panel}
          id={listId}
          role="listbox"
          aria-label={listLabel}
          tabIndex={-1}
          ref={listRef}
          onKeyDown={onListKeyDown}
        >
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={active}
                data-active={active}
                className={`${styles.option} ${active ? styles.optionActive : ""}`}
                onClick={() => select(opt.value)}
              >
                {opt.icon != null && renderIcon(opt.icon)}
                <span className={styles.optionLabel}>{opt.label}</span>
                {active && (
                  <span className={styles.check} aria-hidden>
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
