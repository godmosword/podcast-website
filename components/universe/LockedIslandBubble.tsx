"use client";

import styles from "./LockedIslandBubble.module.css";

type Props = {
  message: string;
  bubbleKey: number;
  reduced?: boolean;
};

/** 未開放島點擊時的短暫對話泡泡（純 DOM/CSS，aria-hidden）。 */
export default function LockedIslandBubble({ message, bubbleKey, reduced = false }: Props) {
  return (
    <span
      key={bubbleKey}
      className={`${styles.bubble} ${reduced ? styles.bubbleReduced : ""}`}
      aria-hidden="true"
    >
      {message}
    </span>
  );
}
