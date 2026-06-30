"use client";

import {
  roamerHasRear,
  roamerSpriteSrc,
  type Roamer,
} from "@/data/universe-roamers";
import styles from "./RoamerVehicle.module.css";

type Props = {
  roamer: Roamer;
  usePlaceholder: boolean;
  night: boolean;
  /** map 層用 stage 高度比例；island 層用 tile 高度比例 */
  sizeKind: "map" | "island";
};

export default function RoamerVehicle({
  roamer,
  usePlaceholder,
  night,
  sizeKind,
}: Props) {
  const sizeClass = sizeKind === "map" ? styles.mapSize : styles.islandSize;
  const hasRear = roamerHasRear(roamer);

  return (
    <div
      data-roamer-id={roamer.id}
      className={`${styles.roamer} ${sizeClass}`}
    >
      <span data-roamer-shadow className={styles.shadow} aria-hidden="true" />
      <div data-roamer-body={roamer.id} data-dir="front" className={styles.body}>
        {usePlaceholder ? (
          <span className={styles.placeholder} />
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={roamerSpriteSrc(roamer, "front", night)}
              alt=""
              className={`${styles.img} ${styles.imgFront}`}
              draggable={false}
              decoding="async"
            />
            {hasRear && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={roamerSpriteSrc(roamer, "rear", night)}
                alt=""
                className={`${styles.img} ${styles.imgRear}`}
                draggable={false}
                decoding="async"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
