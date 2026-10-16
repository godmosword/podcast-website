"use client";

import type { CSSProperties } from "react";
import { ToppingArt } from "@/lib/games/dino-sushi/art";
import type { ToppingId } from "@/lib/games/dino-sushi/toppings";
import styles from "./DinoSushiKitchen.module.css";

export type EvictFly = {
  key: number;
  id: ToppingId;
  from: DOMRect;
  to: DOMRect;
};

/** 被擠掉的料：縮小飛回托盤那一格。減少動態時 CSS 改成原地淡出。 */
export function DinoSushiEvictFly({ fly, onDone }: { fly: EvictFly; onDone: (key: number) => void }) {
  const size = fly.from.width || 64;
  const style = {
    "--from-x": `${fly.from.left}px`,
    "--from-y": `${fly.from.top}px`,
    "--to-x": `${fly.to.left + fly.to.width / 2 - size / 2}px`,
    "--to-y": `${fly.to.top + fly.to.height / 2 - size / 2}px`,
    "--fly-size": `${size}px`,
  } as CSSProperties;

  return (
    <span className={styles.evictFly} style={style} data-evict={fly.id} aria-hidden onAnimationEnd={() => onDone(fly.key)}>
      <ToppingArt id={fly.id} />
    </span>
  );
}
