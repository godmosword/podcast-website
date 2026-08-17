"use client";

import type { Playground } from "@/data/playgrounds";
import styles from "./PlayMap.module.css";

export type PlayMapEditorialPickProps = {
  place: Playground;
  reason: string;
  onSelect: (id: string, trigger: HTMLElement) => void;
};

export function PlayMapEditorialPick({
  place,
  reason,
  onSelect,
}: PlayMapEditorialPickProps) {
  return (
    <section
      className={styles.editorialPick}
      aria-labelledby="play-map-editorial-pick-heading"
    >
      <h3
        id="play-map-editorial-pick-heading"
        className={styles.editorialPickEyebrow}
      >
        ⭐ 媽米先幫你看
      </h3>
      <p className={styles.editorialPickName}>
        {place.name}
      </p>
      <p className={styles.editorialPickReason}>{reason}</p>
      <button
        type="button"
        className={styles.editorialPickButton}
        aria-label={`${place.name}，看看這個`}
        onClick={(event) => onSelect(place.id, event.currentTarget)}
      >
        看看這個
      </button>
    </section>
  );
}
