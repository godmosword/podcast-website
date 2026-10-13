"use client";

import { PlateArt, SushiArt } from "@/lib/games/dino-sushi/art";
import { BELT_PLATES, LanternArt, ShopWindowArt } from "@/lib/games/dino-sushi/shop-art";
import styles from "./DinoSushiShop.module.css";

/**
 * 迴轉壽司店的牆面：粉彩雨棚、木招牌、紅燈籠、看得到摩天輪的圓窗、木腰板（全是背景，對讀屏隱藏）。
 * 舞台太矮（320×568 直向）時招牌與燈籠由 container query 收起，只留雨棚與迴轉帶；圓窗只在直向高舞台出現。
 */
export function ShopWall() {
  return (
    <div className={styles.wall} aria-hidden>
      <span className={styles.wainscot} />
      <span className={styles.window}>
        <ShopWindowArt />
      </span>
      <span className={styles.awningWrap}>
        <span className={styles.awning} />
      </span>
      <span className={styles.kanban}>
        <span className={styles.kanbanText}>多多壽司</span>
      </span>
      <span className={`${styles.lantern} ${styles.lanternLeft}`}>
        <LanternArt />
      </span>
      <span className={`${styles.lantern} ${styles.lanternRight}`}>
        <LanternArt />
      </span>
    </div>
  );
}

/**
 * 迴轉帶＋木櫃台，在多多前面。帶上的裝飾盤慢慢由右往左繞（兩份一樣的盤列接起來無縫循環）；
 * 減少動態、暫停時停住。送給多多的那盤在前排，由 DinoSushiDuoDuo 畫。
 */
export function ShopBelt() {
  const plates = [...BELT_PLATES, ...BELT_PLATES];
  return (
    <div className={styles.counter} aria-hidden>
      <span className={styles.belt}>
        <span className={styles.beltSeams} />
      </span>
      <span className={styles.beltLane}>
        <span className={styles.beltTrack}>
          {plates.map((p, i) => (
            <span key={i} className={styles.beltPlate}>
              <span className={styles.beltSushi}>
                <SushiArt sushi={p.sushi} flat />
              </span>
              <PlateArt tone={p.tone} />
              <span className={styles.dome} />
            </span>
          ))}
        </span>
      </span>
      <span className={styles.counterFront} />
    </div>
  );
}
