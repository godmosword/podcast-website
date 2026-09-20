"use client";

import { useEffect, useRef } from "react";
import type { CandyMatchLevel } from "@/lib/games/candy-match/levels";
import { IconLock, IconStar } from "@/components/games/ClayIcons";
import styles from "./CandyMatchMap.module.css";

/**
 * K-6（兒童減法審）：消消樂地圖以圖代字。
 * 10 個站點沿一條蜿蜒小路排列，每站一張黏土小圖（rainbow-gate…fireworks）；
 * 下一站有呼吸光圈、鎖住的站灰掉＋鎖頭、過關的站在圖下亮星。地名只進 aria-label。
 */

/** 站點座標（viewBox 100×230，百分比即可直接給 CSS） */
const NODES: readonly { x: number; y: number }[] = [
  { x: 22, y: 210 },
  { x: 62, y: 190 },
  { x: 80, y: 160 },
  { x: 40, y: 140 },
  { x: 20, y: 112 },
  { x: 58, y: 96 },
  { x: 82, y: 70 },
  { x: 44, y: 52 },
  { x: 22, y: 28 },
  { x: 60, y: 14 },
] as const;

function pathD(): string {
  const [first, ...rest] = NODES;
  let d = `M ${first.x} ${first.y}`;
  let prev = first;
  for (const n of rest) {
    const cx = (prev.x + n.x) / 2;
    d += ` Q ${cx} ${prev.y}, ${cx} ${(prev.y + n.y) / 2} T ${n.x} ${n.y}`;
    prev = n;
  }
  return d;
}

type CandyMatchMapProps = {
  levels: readonly CandyMatchLevel[];
  /** 每關星數（0–3） */
  stars: readonly number[];
  /** 已通關數＝下一個可玩的 index */
  maxCleared: number;
  onSelect: (index: number) => void;
};

export function CandyMatchMap({ levels, stars, maxCleared, onSelect }: CandyMatchMapProps) {
  const nextRef = useRef<HTMLButtonElement | null>(null);

  // 小路由下往上走：新玩家的第一站在地圖底部，844 高的手機會在首屏之外。
  // 開地圖時若「下一站」不在視窗內就把它捲到中間，孩子一眼看到會呼吸的那顆。
  useEffect(() => {
    const el = nextRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const inView = r.top >= 0 && r.bottom <= window.innerHeight;
    if (inView) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
  }, [maxCleared]);

  return (
    <div className={styles.map} data-testid="candy-match-map">
      <svg className={styles.road} viewBox="0 0 100 230" preserveAspectRatio="none" aria-hidden>
        <path d={pathD()} className={styles.roadBed} />
        <path d={pathD()} className={styles.roadDash} />
      </svg>
      {levels.map((lv, i) => {
        const node = NODES[i] ?? NODES[NODES.length - 1];
        const locked = i > maxCleared;
        const next = !locked && i === maxCleared;
        const got = Math.max(0, Math.min(3, stars[i] ?? 0));
        return (
          <button
            key={lv.index}
            ref={next ? nextRef : undefined}
            type="button"
            className={`${styles.node}${next ? ` ${styles.next}` : ""}${locked ? ` ${styles.locked}` : ""}`}
            style={{ left: `${node.x}%`, top: `${(node.y / 230) * 100}%` }}
            disabled={locked}
            data-next={next ? "true" : undefined}
            aria-label={`第 ${i + 1} 關 ${lv.place}${locked ? "（未解鎖）" : ""}`}
            title={lv.place}
            onClick={() => onSelect(i)}
          >
            <span className={styles.badge}>
              {/* eslint-disable-next-line @next/next/no-img-element -- 固定 256px 黏土小圖 */}
              <img
                src={`/games/v2/candy-match/places/${lv.placeIcon}.webp`}
                alt=""
                width={256}
                height={256}
                className={styles.icon}
                loading={i < 4 ? "eager" : "lazy"}
              />
              {locked ? (
                <span className={styles.lock} aria-hidden>
                  <IconLock size={18} />
                </span>
              ) : null}
            </span>
            {!locked ? (
              <span className={styles.stars} aria-label={`${got} 顆星`}>
                {[0, 1, 2].map((s) => (
                  <span key={s} aria-hidden className={s < got ? undefined : styles.starEmpty}>
                    <IconStar size={14} color={s < got ? "#ffd34d" : "#d9d0e0"} />
                  </span>
                ))}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
