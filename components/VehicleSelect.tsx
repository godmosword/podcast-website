"use client";

import { useEffect, useRef, useState } from "react";
import VehicleClayIcon from "./VehicleClayIcon";
import { playSfx } from "@/lib/sfx";
import styles from "./VehicleSelect.module.css";

const ALL_VALUE = "__all__";
const ALL_LABEL = "全部車車";

type VehicleSelectProps = {
  vehicles: string[];
  /** 目前選中的車種；null 代表全部 */
  value: string | null;
  onChange: (vehicle: string | null) => void;
};

/** 帶縮圖的車種下拉選單（自訂 listbox，可鍵盤操作）。 */
export default function VehicleSelect({
  vehicles,
  value,
  onChange,
}: VehicleSelectProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const options = [ALL_VALUE, ...vehicles];
  const currentKey = value ?? ALL_VALUE;

  // 點選單外或按 Esc 自動收起（對齊 StoryPlayer 定時選單慣例）
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

  // 開啟時把焦點移到目前選項
  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>('[data-active="true"]')
      ?.focus();
  }, [open]);

  function select(key: string) {
    playSfx("tap");
    onChange(key === ALL_VALUE ? null : key);
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
        aria-label="選擇車車"
        onClick={() => setOpen((o) => !o)}
      >
        <span className={styles.triggerInner}>
          {value ? (
            <VehicleClayIcon vehicle={value} size={28} />
          ) : (
            <span className={styles.allIcon} aria-hidden>
              🚗
            </span>
          )}
          <span className={styles.triggerLabel}>{value ?? ALL_LABEL}</span>
        </span>
        <span className={styles.arrow} aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <div
          className={styles.panel}
          role="listbox"
          aria-label="車車"
          tabIndex={-1}
          ref={listRef}
          onKeyDown={onListKeyDown}
        >
          {options.map((key) => {
            const active = key === currentKey;
            const isAll = key === ALL_VALUE;
            return (
              <button
                key={key}
                type="button"
                role="option"
                aria-selected={active}
                data-active={active}
                className={`${styles.option} ${active ? styles.optionActive : ""}`}
                onClick={() => select(key)}
              >
                {isAll ? (
                  <span className={styles.allIcon} aria-hidden>
                    🚗
                  </span>
                ) : (
                  <VehicleClayIcon vehicle={key} size={28} />
                )}
                <span className={styles.optionLabel}>
                  {isAll ? ALL_LABEL : key}
                </span>
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
