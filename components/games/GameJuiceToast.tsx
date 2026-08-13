"use client";

import styles from "./GameJuiceToast.module.css";

type GameJuiceToastProps = {
  text: string;
  big?: boolean;
  reduced?: boolean;
};

/** 局內短慶祝（連鎖／消行）。只做 transform／opacity。 */
export function GameJuiceToast({ text, big = false, reduced = false }: GameJuiceToastProps) {
  return (
    <div
      className={`${styles.toast}${big ? ` ${styles.big}` : ""}${reduced ? ` ${styles.static}` : ""}`}
      role="status"
    >
      {text}
    </div>
  );
}
