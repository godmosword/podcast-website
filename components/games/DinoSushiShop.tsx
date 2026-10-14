"use client";

import { PlateArt, SHOP_SRC, SushiArt } from "@/lib/games/dino-sushi/art";
import { BELT_PLATES } from "@/lib/games/dino-sushi/shop-art";
import styles from "./DinoSushiShop.module.css";

/**
 * 迴轉壽司店的牆面：黏土牆、雨棚、燈籠、圓窗（全是背景，對讀屏隱藏）。
 * 店名「多多壽司」刻在櫃台前板上（ShopBelt），不再用掛在多多後面、會被擋住的直式招牌。
 * 舞台太矮時燈籠收起，只留雨棚與迴轉帶。
 */
export function ShopWall() {
  return (
    <div className={styles.wall} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element -- 原檔店面，不走 next/image */}
      <img className={styles.wallPhoto} src={SHOP_SRC.wall} alt="" draggable={false} decoding="sync" />
      <span className={styles.window}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={SHOP_SRC.window} alt="" draggable={false} decoding="sync" />
      </span>
      <span className={styles.awningWrap}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.awning} src={SHOP_SRC.awning} alt="" draggable={false} decoding="sync" />
      </span>
      <span className={`${styles.lantern} ${styles.lanternLeft}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={SHOP_SRC.lantern} alt="" draggable={false} decoding="sync" />
      </span>
      <span className={`${styles.lantern} ${styles.lanternRight}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={SHOP_SRC.lantern} alt="" draggable={false} decoding="sync" />
      </span>
    </div>
  );
}

/**
 * 迴轉帶＋木櫃台，在多多前面。帶面是無縫磚，依磚寬平移；上面的裝飾盤跟著同一段時間繞。
 * 減少動態、暫停時停住。送給多多的那盤在前排，由 DinoSushiDuoDuo 畫。
 * 店名刻在櫃台前板左半：多多站在櫃台上面，右半留給疊盤，什麼都擋不到。
 */
export function ShopBelt() {
  const plates = [...BELT_PLATES, ...BELT_PLATES];
  return (
    <div className={styles.counter} aria-hidden>
      <span className={styles.belt} style={{ ["--belt-image" as string]: `url("${SHOP_SRC.belt}")` }} />
      <span className={styles.beltLane}>
        <span className={styles.beltTrack}>
          {plates.map((p, i) => (
            <span key={i} className={styles.beltPlate}>
              <span className={styles.beltSushi}>
                <SushiArt sushi={p.sushi} flat />
              </span>
              <PlateArt tone={p.tone} />
              <span className={styles.dome}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={SHOP_SRC.dome} alt="" draggable={false} decoding="sync" />
              </span>
            </span>
          ))}
        </span>
      </span>
      <span className={styles.counterFront}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={SHOP_SRC.counter} alt="" draggable={false} decoding="sync" />
      </span>
      <span className={styles.shopName}>多多壽司</span>
    </div>
  );
}
