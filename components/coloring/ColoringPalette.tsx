"use client";

import type { ReactNode } from "react";
import { paletteForGroup, type ColorGroupId } from "@/lib/coloring/tools";
import { playSfx } from "@/lib/sfx";
import styles from "./ColoringPalette.module.css";

type ColoringPaletteProps = {
  colorHex: string;
  onChange: (hex: string) => void;
  group?: ColorGroupId;
};

/**
 * 深底上 #3A2410 對比低於 3:1 的色（綠 2.31、黑 1.19）圖案改淺色。
 * 其餘色塊用深墨圖案。形狀不另做一套。
 */
const LIGHT_MARK = new Set(["green", "black"]);

function SwatchMark({ id }: { id: string }) {
  const mark = LIGHT_MARK.has(id) ? "light" : "ink";
  return (
    <svg
      className={`${styles.mark} ${mark === "light" ? styles.markLight : styles.markInk}`}
      viewBox="0 0 32 32"
      aria-hidden="true"
      data-pattern={id}
      data-mark={mark}
    >
      {marks[id]}
    </svg>
  );
}

const marks: Record<string, ReactNode> = {
  red: <circle cx="16" cy="16" r="7" />,
  orange: <rect x="8" y="8" width="16" height="16" rx="2" />,
  yellow: (
    <polygon points="16,3.5 19.6,12.2 28.8,12.8 21.6,19 23.8,28 16,23.2 8.2,28 10.4,19 3.2,12.8 12.4,12.2" />
  ),
  lime: (
    <>
      <path d="M16 4.5c6 3.2 10.2 8.4 8.4 16.2-5.2-1-11.6-4.2-15.2-9.6C11.2 7.2 13 4.8 16 4.5z" />
      <path
        d="M15.2 8.2c.4 4.2.8 8.4 2.4 13"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </>
  ),
  green: <polygon points="16,5 28,27 4,27" />,
  sky: (
    <path d="M9.2 22.5h14.2c2.6 0 4.6-2 4.6-4.4 0-2.2-1.6-4-3.8-4.4C23.4 10.2 20.6 8 17.4 8c-3.2 0-5.8 2-6.8 4.8-2.2.3-4 2.2-4 4.6 0 2.8 2.2 5.1 4.6 5.1z" />
  ),
  blue: (
    <path d="M16 4.2c0 0-8.2 10.2-8.2 15.2a8.2 8.2 0 0 0 16.4 0C24.2 14.4 16 4.2 16 4.2z" />
  ),
  pink: (
    <g>
      {[0, 72, 144, 216, 288].map((deg) => (
        <ellipse
          key={deg}
          cx="16"
          cy="8.2"
          rx="4"
          ry="5"
          transform={`rotate(${deg} 16 16)`}
        />
      ))}
    </g>
  ),
  brown: <polygon points="16,4 28,16 16,28 4,16" />,
  gray: (
    <>
      <rect x="6" y="8" width="20" height="3" rx="1.5" />
      <rect x="6" y="14.5" width="20" height="3" rx="1.5" />
      <rect x="6" y="21" width="20" height="3" rx="1.5" />
    </>
  ),
  black: <circle cx="16" cy="16" r="4" />,
  white: (
    <circle
      cx="16"
      cy="16"
      r="8"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeDasharray="3.2 2.4"
    />
  ),
};

export function ColoringPalette({
  colorHex,
  onChange,
  group = "all",
}: ColoringPaletteProps) {
  const choices = paletteForGroup(group);
  const selectedIndex = choices.findIndex(
    (s) => s.hex.toLowerCase() === colorHex.toLowerCase(),
  );
  return (
    <div
      className={styles.wrap}
      role="listbox"
      aria-label="著色色盤"
      onKeyDown={(e) => {
        const index = Array.from(
          e.currentTarget.querySelectorAll("button"),
        ).indexOf(e.target as HTMLButtonElement);
        const delta = ["ArrowRight", "ArrowDown"].includes(e.key)
          ? 1
          : ["ArrowLeft", "ArrowUp"].includes(e.key)
            ? -1
            : 0;
        if (!delta && !["Home", "End"].includes(e.key)) return;
        e.preventDefault();
        const next =
          e.key === "Home"
            ? 0
            : e.key === "End"
              ? choices.length - 1
              : (Math.max(0, index) + delta + choices.length) % choices.length;
        onChange(choices[next]!.hex);
        playSfx("pick");
        e.currentTarget.querySelectorAll("button")[next]?.focus();
      }}
    >
      {choices.map((swatch, index) => {
        const selected = swatch.hex.toLowerCase() === colorHex.toLowerCase();
        return (
          <button
            key={swatch.id}
            type="button"
            role="option"
            aria-selected={selected}
            tabIndex={selected || (selectedIndex < 0 && index === 0) ? 0 : -1}
            aria-label={swatch.name}
            className={styles.item}
            onClick={(event) => {
              playSfx("pick");
              onChange(swatch.hex);
              const disc = event.currentTarget.querySelector("[data-swatch-disc]");
              if (!(disc instanceof HTMLElement)) return;
              disc.classList.remove(styles.pop);
              void disc.offsetWidth;
              disc.classList.add(styles.pop);
            }}
          >
            <span
              className={`${styles.swatch} ${selected ? styles.selected : ""}`}
              data-swatch-disc=""
              style={{ background: swatch.hex }}
            >
              <SwatchMark id={swatch.id} />
            </span>
            <span className={styles.name}>{swatch.name}</span>
          </button>
        );
      })}
    </div>
  );
}
