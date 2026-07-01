"use client";

import { useState } from "react";
import { ZONE_TERRAIN, type ZoneId } from "@/data/universe-zones";
import type { ZoneArtSrcSet } from "@/lib/universe/zone-art-src";
import styles from "./ZoneIsland.module.css";

type Props = {
  zoneId: ZoneId;
  artSrc: ZoneArtSrcSet;
  anchorUV: [number, number];
  reduced?: boolean;
};

/** 島 tile：沙草色佔位 + PNG 載入後淡入（A2）。 */
export default function ZoneIslandTileArt({
  zoneId,
  artSrc,
  anchorUV,
  reduced = false,
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const terrain = ZONE_TERRAIN[zoneId];
  const [ax, ay] = anchorUV;
  const showImg = loaded || reduced;

  return (
    <div className={styles.tileArt}>
      {/* 沙草佔位只在圖載入前顯示；載入後移除，否則會從去背島圖的透明區漏出矩形色塊。 */}
      {!showImg && (
        <div
          className={styles.tilePlaceholder}
          aria-hidden="true"
          style={{
            background: `radial-gradient(ellipse 88% 68% at 50% 74%, ${terrain.grass} 0%, ${terrain.sand} 72%)`,
          }}
        />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={artSrc.src}
        srcSet={artSrc.srcSet}
        sizes={artSrc.sizes}
        alt=""
        aria-hidden="true"
        className={`${styles.tileImg} ${showImg ? styles.tileImgLoaded : styles.tileImgPending}`}
        style={{ transformOrigin: `${ax * 100}% ${ay * 100}%` }}
        draggable={false}
        decoding="async"
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
