"use client";

import { PlateArt } from "@/lib/games/dino-sushi/art";
import type { Plate } from "@/lib/games/dino-sushi/round";
import styles from "./DinoSushiKitchen.module.css";

/** 疊太高會擋到多多；超過就只疊這麼多，數字照實顯示。 */
const MAX_VISIBLE = 8;

/** 吃完的盤子疊在旁邊：做了幾個一眼看得出來；一次做對的是金邊盤。 */
export function DinoSushiPlateStack({ plates }: { plates: readonly Plate[] }) {
  const visible = plates.slice(-MAX_VISIBLE);
  return (
    <div className={styles.plates} role="img" aria-label={`吃完 ${plates.length} 盤`}>
      {visible.map((p, i) => (
        <span key={plates.length - visible.length + i} className={styles.plate} style={{ ["--i" as string]: i }}>
          <PlateArt gold={p.gold} />
        </span>
      ))}
      {plates.length > 0 ? (
        <b className={styles.plateCount} aria-hidden>
          {plates.length}
        </b>
      ) : null}
    </div>
  );
}
