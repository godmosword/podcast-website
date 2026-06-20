"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
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
};

/** 共用下拉選單（車種／主題等篩選）。 */
export default function FilterSelect({
  options,
  value,
  onChange,
  ariaLabel,
  listLabel,
}: FilterSelectProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>('[data-active="true"]')
      ?.focus();
  }, [open]);

  function select(next: string) {
    playSfx("tap");
    onChange(next);
    setOpen(false);
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

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={styles.triggerInner}>
          {current.icon != null && (
            <span className={styles.iconSlot} aria-hidden>
              {current.icon}
            </span>
          )}
          <span className={styles.triggerLabel}>{current.label}</span>
        </span>
        <span className={styles.arrow} aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <div
          className={styles.panel}
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
                {opt.icon != null && (
                  <span className={styles.iconSlot} aria-hidden>
                    {opt.icon}
                  </span>
                )}
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
