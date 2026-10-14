"use client";

import { useEffect } from "react";
import { dinoSushiSrc } from "./asset-src";
import type { DuoDuoFace, DuoDuoMouth } from "./duoduo-art";
import styles from "./duoduo-sticker.module.css";

/**
 * 局內多多是和封面同一套的黏土貼紙（1024 透明底，角色站在同一條底線）。
 * 不要改這些圖；畫面讀縮小副本（見 asset-src）。張嘴、咀嚼用嘴的貼紙；反應用表情貼紙。
 * 芥末的心情仍是 puff，貼紙改成噴火的 fire（取代白煙 puff）。
 */

export const DUODUO_STICKER_STATES = [
  "closed",
  "open",
  "chew",
  "laugh",
  "love",
  "yum",
  "sweet",
  "fire",
  "look",
] as const;

export type DuoDuoStickerState = (typeof DUODUO_STICKER_STATES)[number];

export function duoduoStickerSrc(state: DuoDuoStickerState): string {
  return dinoSushiSrc(`duoduo/sticker-${state}.webp`);
}

export const DUODUO_TOOTHBRUSH_SRC = dinoSushiSrc("duoduo/sticker-toothbrush.webp");

const FACE_STICKER: Partial<Record<DuoDuoFace, DuoDuoStickerState>> = {
  love: "love",
  yum: "yum",
  sweet: "sweet",
  look: "look",
  puff: "fire",
};

export function stickerFor(mouth: DuoDuoMouth, face: DuoDuoFace): DuoDuoStickerState {
  if (mouth === "open" || mouth === "chew") return mouth;
  const mood = FACE_STICKER[face];
  if (mood) return mood;
  if (mouth === "laugh") return "laugh";
  return "closed";
}

const PRELOAD_SRCS = [...DUODUO_STICKER_STATES.map(duoduoStickerSrc), DUODUO_TOOTHBRUSH_SRC];

/** 標題頁就先解碼，換嘴或換表情時才不會閃一下。 */
export function useDuoDuoStickerPreload() {
  useEffect(() => {
    const images = PRELOAD_SRCS.map((src) => {
      const img = new Image();
      img.decoding = "async";
      img.src = src;
      return img;
    });
    return () => {
      for (const img of images) img.src = "";
    };
  }, []);
}

export function DuoDuoSticker({ mouth, face }: { mouth: DuoDuoMouth; face: DuoDuoFace }) {
  const active = stickerFor(mouth, face);
  return (
    <span className={styles.figure} data-mouth={mouth} data-face={face}>
      {DUODUO_STICKER_STATES.map((state) => (
        // 原檔貼紙，不走 next/image 轉檔。
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={state}
          src={duoduoStickerSrc(state)}
          alt=""
          data-active={state === active ? "true" : undefined}
          decoding="sync"
          draggable={false}
        />
      ))}
    </span>
  );
}

export function ToothbrushSticker() {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- 原檔貼紙，不走 next/image 轉檔
    <img src={DUODUO_TOOTHBRUSH_SRC} alt="" decoding="sync" draggable={false} />
  );
}
