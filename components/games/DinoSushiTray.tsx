"use client";

import { ToppingArt, traySrc } from "@/lib/games/dino-sushi/art";
import { toppingById, type ToppingId } from "@/lib/games/dino-sushi/toppings";
import { TapButton, TapFinger } from "./DinoSushiPiece";
import styles from "./DinoSushiKitchen.module.css";

type Props = {
  tray: readonly ToppingId[];
  /** 主題日：托盤底換色。料的顏色不變。 */
  theme?: "yellow" | "green" | "seafood";
  themeLabel?: string;
  /** 吃東西、看泡泡、暫停：真的停用（原生 disabled）。 */
  disabled: boolean;
  /**
   * 還沒選飯：托盤變淡、看得出現在不能放料。仍可點（aria-disabled），點了不加料，
   * 改成叫 onWaitTap（廚房讓該點的皿跳一下）。
   */
  waitingForBase: boolean;
  onWaitTap: () => void;
  hint: ToppingId | null;
  teaching: boolean;
  onAdd: (id: ToppingId) => void;
};

/** 托盤 2×4（橫向 4×2）：每格圖＋字，不分頁不捲動。 */
export function DinoSushiTray({ tray, theme, themeLabel, disabled, waitingForBase, onWaitTap, hint, teaching, onAdd }: Props) {
  const waiting = waitingForBase && !disabled;
  return (
    <div
      className={styles.tray}
      role="group"
      aria-label={themeLabel ? `壽司料，${themeLabel}` : "壽司料"}
      data-role="tray"
      data-theme={theme}
      data-wait={waitingForBase ? "base" : undefined}
    >
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
            data-topping={id}
            disabled={disabled}
            aria-disabled={waiting ? true : undefined}
            onTap={() => (waiting ? onWaitTap() : onAdd(id))}
          >
            <span
              className={styles.trayArt}
              style={{ backgroundImage: `url("${traySrc(meta.kind)}")` }}
              aria-hidden
            >
              <ToppingArt id={id} />
            </span>
            <span className={styles.trayLabel} aria-hidden>
              {meta.label}
            </span>
            {hinted && teaching ? <TapFinger /> : null}
          </TapButton>
        );
      })}
    </div>
  );
}
