"use client";

import { COLORING_PALETTE } from "@/lib/coloring/tools";
import styles from "./ColoringPalette.module.css";

type ColoringPaletteProps = {
  colorHex: string;
  onChange: (hex: string) => void;
};

export function ColoringPalette({ colorHex, onChange }: ColoringPaletteProps) {
  return (
    <div className={styles.wrap} role="listbox" aria-label="著色色盤">
      {COLORING_PALETTE.map((swatch) => {
        const selected = swatch.hex.toLowerCase() === colorHex.toLowerCase();
        return (
          <button
            key={swatch.id}
            type="button"
            role="option"
            aria-selected={selected}
            aria-label={swatch.name}
            className={`${styles.swatch} ${selected ? styles.selected : ""}`}
            style={{ background: swatch.hex }}
            onClick={() => onChange(swatch.hex)}
          />
        );
      })}
    </div>
  );
}
