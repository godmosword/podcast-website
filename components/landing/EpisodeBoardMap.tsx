import type { ReactNode } from "react";
import { BOARD_ISLANDS, BOARD_LIGHT } from "@/lib/episode-board-sim";
import { mapDepthZ } from "@/lib/universe-depth";
import {
  cloudPath,
  moonPath,
  moonWebpPath,
  seaTexturePath,
  sunPath,
  sunWebpPath,
} from "@/lib/universe/map-art-src";
import { pngToWebp } from "@/lib/universe/png-to-webp";
import styles from "./EpisodeBoard.module.css";

/** 與 data/universe.ts 的五島狀態一致。開放島夜間不調暗。 */
export const ISLAND_STATUS = {
  forest: "building",
  dino: "building",
  rescue: "coming",
  "car-park": "open",
  ocean: "planned",
} as const;

const BRIDGES = [
  "M 50 20 C 48 28 46 36 50 50",
  "M 16 34 C 28 38 38 42 50 50",
  "M 84 34 C 72 38 62 44 50 50",
  "M 50 50 C 44 60 36 66 28 74",
] as const;

type Props = { children: ReactNode };

/**
 * 首頁角色看板的地圖：層次對齊宇宙地圖
 * （海面貼圖 → 棧道 → 五島黏土圖 → 海上小建物 → 車車）。
 * 深度用同一個 mapDepthZ，y 越大越靠近鏡頭。
 */
export default function EpisodeBoardMap({ children }: Props) {
  return (
    <>
      <div
        className={styles.sea}
        aria-hidden="true"
        style={{ backgroundImage: `url(${pngToWebp(seaTexturePath(false))})` }}
      />
      <div
        className={styles.seaNight}
        aria-hidden="true"
        style={{ backgroundImage: `url(${pngToWebp(seaTexturePath(true))})` }}
      />
      <div className={styles.sky} aria-hidden="true">
        {/* 跟宇宙地圖同一批海天素材，這段在首屏下面，不拿來當 LCP。 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.cloudA} src={pngToWebp(cloudPath("cloud-a"))} alt="" draggable={false} decoding="async" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.cloudB} src={pngToWebp(cloudPath("cloud-b"))} alt="" draggable={false} decoding="async" />
        <picture>
          <source type="image/webp" srcSet={sunWebpPath()} />
          <img className={styles.sun} src={sunPath()} alt="" draggable={false} />
        </picture>
        <picture>
          <source type="image/webp" srcSet={moonWebpPath()} />
          <img className={styles.moon} src={moonPath()} alt="" draggable={false} />
        </picture>
      </div>
      <div className={styles.world}>
        <svg className={styles.bridges} viewBox="0 0 100 100" style={{ zIndex: mapDepthZ(30, "bridge") }} aria-hidden="true">
          {BRIDGES.map((d) => (
            <path key={d} d={d} className={styles.bridge} />
          ))}
        </svg>
        {BOARD_ISLANDS.map((island) => (
          <div
            key={island.id}
            className={styles.island}
            data-zone={island.id}
            data-status={ISLAND_STATUS[island.id]}
            style={{
              left: `${island.x}%`,
              top: `${island.y}%`,
              zIndex: mapDepthZ(island.y, "island"),
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={styles.islandImg}
              src={`/adventures/zones/${island.id}.webp`}
              alt=""
              draggable={false}
              decoding="async"
            />
          </div>
        ))}
        <span
          className={styles.signal}
          aria-hidden="true"
          style={{
            left: `${BOARD_LIGHT.x}%`,
            top: `${BOARD_LIGHT.y}%`,
            zIndex: mapDepthZ(BOARD_LIGHT.y, "island"),
          }}
        />
        {children}
      </div>
    </>
  );
}
