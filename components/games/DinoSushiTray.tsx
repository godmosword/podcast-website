"use client";

import { IconTap } from "@/components/games/ClayIcons";
import { ToppingArt } from "@/lib/games/dino-sushi/art";
import { toppingById, type ToppingId } from "@/lib/games/dino-sushi/toppings";
import { TapButton } from "./DinoSushiPiece";
import styles from "./DinoSushiKitchen.module.css";

type Props = {
  tray: readonly ToppingId[];
  disabled: boolean;
  hint: ToppingId | null;
  teaching: boolean;
  onAdd: (id: ToppingId) => void;
};

/** 托盤 2×4（橫向 4×2）：每格圖＋字，不分頁不捲動。 */
export function DinoSushiTray({ tray, disabled, hint, teaching, onAdd }: Props) {
  return (
    <div className={styles.tray} role="group" aria-label="壽司料">
      {tray.map((id) => {
        const meta = toppingById(id);
        const hinted = hint === id;
        return (
          <TapButton
            key={id}
            className={styles.trayButton}
            data-kind={meta.kind}
            data-hint={hinted ? "true" : undefined}
            aria-label={`加${meta.label}`}
            disabled={disabled}
            onTap={() => onAdd(id)}
          >
            <span className={styles.trayArt} aria-hidden>
              <ToppingArt id={id} />
            </span>
            <span className={styles.trayLabel} aria-hidden>
              {meta.label}
            </span>
            {hinted && teaching ? (
              <span className={styles.finger} aria-hidden>
                <IconTap size={30} />
              </span>
            ) : null}
          </TapButton>
        );
      })}
    </div>
  );
}
