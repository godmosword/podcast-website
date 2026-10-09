"use client";

import { paletteForGroup, type ColorGroupId } from "@/lib/coloring/tools";
import { playSfx } from "@/lib/sfx";
import styles from "./ColoringPalette.module.css";

type ColoringPaletteProps = {
  colorHex: string;
  onChange: (hex: string) => void;
  group?: ColorGroupId;
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
            className={`${styles.swatch} ${selected ? styles.selected : ""}`}
            style={{ background: swatch.hex }}
            onClick={(event) => {
              playSfx("pick");
              onChange(swatch.hex);
              const el = event.currentTarget;
              el.classList.remove(styles.pop);
              void el.offsetWidth;
              el.classList.add(styles.pop);
            }}
          />
        );
      })}
    </div>
  );
}
