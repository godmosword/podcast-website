"use client";

import { useEffect, type CSSProperties } from "react";
import { dinoSushiSrc } from "./asset-src";
import type { Mood } from "./reactions";
import styles from "./duoduo-sticker.module.css";

/**
 * 局內多多是和封面同一套的黏土貼紙（1024 透明底，角色站在同一條底線）。
 * 不要改這些圖；畫面讀縮小副本（見 asset-src）。張嘴、咀嚼用嘴的貼紙；反應用表情貼紙。
 * 芥末的心情仍是 puff，貼紙改成噴火的 fire（取代白煙 puff）。
 */

/** 多多的嘴與表情名稱（向量檔已退役，貼紙用這兩組決定顯示哪一張）。 */
export type DuoDuoMouth = "closed" | "open" | "chew" | "laugh";
export type DuoDuoFace = Mood | "idle";

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

/** 輪底要落的高度（畫布比例）：`.figure` 的變形原點與接地影都在 92%。 */
export const STICKER_GROUND = 942 / 1024;

/**
 * 每張貼紙的對齊值（畫布比例）。量法：1024 原圖，綠色車身欄位 ≥12 像素算車身，cx 是車身左右中點；
 * wheel 是不透明深色輪胎的最低點。畫面繞 (cx, wheel) 縮放，再往下移 ty，輪底就落在 STICKER_GROUND。
 * 縮放用車身寬與剪影面積折衷、夾在 0.95–1.05；不做水平平移（姿勢差異之內，移了臉反而錯位）。
 * fire 的車身刻意偏左、右邊留給火焰，只對齊輪底。
 */
export const STICKER_FIT: Record<DuoDuoStickerState, { cx: number; wheel: number; ty: number; scale: number }> = {
  closed: { cx: 509 / 1024, wheel: 918 / 1024, ty: 24 / 1024, scale: 1 },
  open: { cx: 518 / 1024, wheel: 944 / 1024, ty: -2 / 1024, scale: 0.965 },
  chew: { cx: 519 / 1024, wheel: 937 / 1024, ty: 5 / 1024, scale: 0.98 },
  laugh: { cx: 508 / 1024, wheel: 933 / 1024, ty: 9 / 1024, scale: 1 },
  love: { cx: 524 / 1024, wheel: 933 / 1024, ty: 9 / 1024, scale: 1 },
  yum: { cx: 511 / 1024, wheel: 943 / 1024, ty: -1 / 1024, scale: 0.955 },
  sweet: { cx: 516 / 1024, wheel: 942 / 1024, ty: 0, scale: 1.04 },
  fire: { cx: 383 / 1024, wheel: 906 / 1024, ty: 36 / 1024, scale: 1 },
  look: { cx: 513 / 1024, wheel: 929 / 1024, ty: 13 / 1024, scale: 1 },
};

function pct(n: number): string {
  return `${Math.round(n * 10000) / 100}%`;
}

function fitStyle(state: DuoDuoStickerState): CSSProperties {
  const { cx, wheel, ty, scale } = STICKER_FIT[state];
  return {
    transformOrigin: `${pct(cx)} ${pct(wheel)}`,
    transform: `translateY(${pct(ty)}) scale(${scale})`,
  };
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
          style={fitStyle(state)}
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
