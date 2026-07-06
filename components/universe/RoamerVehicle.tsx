"use client";

import type { MouseEvent } from "react";
import {
  roamerHasRear,
  roamerSpriteSrc,
  type Roamer,
} from "@/data/universe-roamers";
import RoamerGreeting from "./RoamerGreeting";
import RoamerSpritePicture from "./RoamerSpritePicture";
import styles from "./RoamerVehicle.module.css";

export type RoamerGreetingState = {
  message: string;
  key: number;
};

type Props = {
  roamer: Roamer;
  usePlaceholder: boolean;
  night: boolean;
  /** map 層用 stage 高度比例；island 層用 tile 高度比例 */
  sizeKind: "map" | "island";
  onTap?: (roamer: Roamer) => void;
  greeting?: RoamerGreetingState | null;
  reduced?: boolean;
};

export default function RoamerVehicle({
  roamer,
  usePlaceholder,
  night,
  sizeKind,
  onTap,
  greeting = null,
  reduced = false,
}: Props) {
  const sizeClass = sizeKind === "map" ? styles.mapSize : styles.islandSize;
  const hasRear = roamerHasRear(roamer);
  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!onTap) return;
    e.stopPropagation();
    onTap(roamer);
  };

  return (
    <div
      data-roamer-id={roamer.id}
      data-clickable={onTap ? true : undefined}
      data-greet={greeting && !reduced ? true : undefined}
      className={`${styles.roamer} ${sizeClass}`}
      onClick={handleClick}
    >
      <span data-roamer-shadow className={styles.shadow} aria-hidden="true" />
      <div data-roamer-body={roamer.id} data-dir="front" className={styles.body}>
        {usePlaceholder ? (
          <span className={styles.placeholder} />
        ) : (
          <>
            <RoamerSpritePicture
              pngSrc={roamerSpriteSrc(roamer, "front", night)}
              className={`${styles.img} ${styles.imgFront}`}
            />
            {hasRear && (
              <RoamerSpritePicture
                pngSrc={roamerSpriteSrc(roamer, "rear", night)}
                className={`${styles.img} ${styles.imgRear}`}
                fetchPriority="low"
              />
            )}
          </>
        )}
      </div>
      {greeting ? (
        <RoamerGreeting
          key={greeting.key}
          message={greeting.message}
          reduced={reduced}
        />
      ) : null}
    </div>
  );
}
