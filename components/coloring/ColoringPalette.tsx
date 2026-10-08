"use client";

import { COLORING_PALETTE } from "@/lib/coloring/tools";
import { playSfx } from "@/lib/sfx";
import styles from "./ColoringPalette.module.css";

type ColoringPaletteProps = {
  colorHex: string;
  onChange: (hex: string) => void;
  group?: "all" | "rainbow" | "forest";
};

export function ColoringPalette({
  colorHex,
  onChange,
  group = "all",
}: ColoringPaletteProps) {
  const choices = COLORING_PALETTE.filter(
    (s) =>
      group === "all" ||
      (group === "rainbow"
        ? ["red", "orange", "yellow", "green", "blue", "pink"].includes(s.id)
        : ["green", "lime", "brown", "yellow", "black", "white"].includes(
            s.id,
          )),
  );
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
            onClick={() => {
              playSfx("tap");
              onChange(swatch.hex);
            }}
          />
        );
      })}
    </div>
  );
}
