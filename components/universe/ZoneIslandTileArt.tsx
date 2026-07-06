"use client";

import { useEffect, useState } from "react";
import { ZONE_TERRAIN, type ZoneId } from "@/data/universe-zones";
import type { ZoneArtSrcSet } from "@/lib/universe/zone-art-src";
import ArtSrcPicture from "./ArtSrcPicture";
import styles from "./ZoneIsland.module.css";

type Props = {
  zoneId: ZoneId;
  artSrc: ZoneArtSrcSet;
  anchorUV: [number, number];
  reduced?: boolean;
  /** R-joy 3 夜間點燈版（`hasNightArt` 未備時為 null，夜間沿用日圖）。 */
  nightArtSrc?: ZoneArtSrcSet | null;
  night?: boolean;
};

/** 島 tile：沙草色佔位 + PNG/WebP 載入後淡入（A2）；
 * 夜間點燈版疊於日圖上 crossfade（首次切夜才掛載，日間訪客零下載；
 * 夜圖載入失敗即永久隱藏夜層，日圖常駐＝優雅降級）。 */
export default function ZoneIslandTileArt({
  zoneId,
  artSrc,
  anchorUV,
  reduced = false,
  nightArtSrc = null,
  night = false,
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [nightMounted, setNightMounted] = useState(false);
  const [nightFailed, setNightFailed] = useState(false);
  const terrain = ZONE_TERRAIN[zoneId];
  const [ax, ay] = anchorUV;
  const showImg = loaded || reduced;

  useEffect(() => {
    if (night && nightArtSrc) setNightMounted(true);
  }, [night, nightArtSrc]);

  const anchorStyle = { transformOrigin: `${ax * 100}% ${ay * 100}%` };

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
        style={anchorStyle}
        onLoad={() => setLoaded(true)}
      />
      {nightMounted && nightArtSrc && !nightFailed ? (
        <ArtSrcPicture
          artSrc={nightArtSrc}
          className={`${styles.tileImg} ${styles.tileImgNight} ${
            night ? styles.tileImgNightVisible : ""
          }`}
          style={anchorStyle}
          onError={() => setNightFailed(true)}
        />
      ) : null}
    </div>
  );
}
