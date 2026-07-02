"use client";

import { useState } from "react";
import { ZONE_TERRAIN, type ZoneId } from "@/data/universe-zones";
import type { ZoneArtSrcSet } from "@/lib/universe/zone-art-src";
import ArtSrcPicture from "./ArtSrcPicture";
import styles from "./ZoneIsland.module.css";

type Props = {
  zoneId: ZoneId;
  artSrc: ZoneArtSrcSet;
  anchorUV: [number, number];
  reduced?: boolean;
};

/** 島 tile：沙草色佔位 + PNG/WebP 載入後淡入（A2）。 */
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
      <div
        className={`${styles.tilePlaceholder} ${showImg ? styles.tilePlaceholderHidden : ""}`}
        aria-hidden="true"
        style={{
          background: `radial-gradient(ellipse 82% 62% at 50% 72%, ${terrain.grass} 0%, ${terrain.sand} 58%, transparent 74%)`,
        }}
      />
      <ArtSrcPicture
        artSrc={artSrc}
        className={`${styles.tileImg} ${showImg ? styles.tileImgLoaded : styles.tileImgPending}`}
        style={{ transformOrigin: `${ax * 100}% ${ay * 100}%` }}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
