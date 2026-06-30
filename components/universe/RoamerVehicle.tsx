"use client";

import type { Roamer } from "@/data/universe-roamers";
import styles from "./RoamerVehicle.module.css";

type Props = {
  roamer: Roamer;
  usePlaceholder: boolean;
  src: string;
  /** map 層用 stage 高度比例；island 層用 tile 高度比例 */
  sizeKind: "map" | "island";
};

export default function RoamerVehicle({ roamer, usePlaceholder, src, sizeKind }: Props) {
  const sizeClass = sizeKind === "map" ? styles.mapSize : styles.islandSize;

  return (
    <div
      data-roamer-id={roamer.id}
      className={`${styles.roamer} ${sizeClass}`}
    >
      <span className={styles.shadow} aria-hidden="true" />
      <div data-roamer-body={roamer.id} className={styles.body}>
        {usePlaceholder ? (
          <span className={styles.placeholder} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className={styles.img} draggable={false} decoding="async" />
        )}
      </div>
    </div>
  );
}
