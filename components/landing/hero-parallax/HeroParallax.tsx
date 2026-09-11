"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import styles from "./HeroParallax.module.css";
import {
  PARALLAX_ASSET_PATH,
  PARALLAX_HERO_SPRITE,
  PARALLAX_LAYERS,
  TILE_COPIES,
  loopDurationSeconds,
  type ParallaxLayer,
} from "./layers";

export interface HeroParallaxProps {
  /** false 時凍結所有動畫（暫停、頁面隱藏、捲出視窗、按下進入）。 */
  running: boolean;
  /** 路面與主角兩張 LCP 關鍵圖都載好之後呼叫一次。 */
  onReady?: () => void;
}

type LayerStyle = CSSProperties & { "--w": string; "--h": string; "--dur": string };

const layerStyle = (layer: ParallaxLayer): LayerStyle => ({
  "--w": `${layer.width}px`,
  "--h": `${layer.height}px`,
  "--dur": `${loopDurationSeconds(layer).toFixed(2)}s`,
});

/**
 * 橫向 2.5D 視差帶（規格 docs/specs/HERO-PARALLAX-SPEC.md §4）。
 *
 * 純 CSS transform，沒有 WebGL、沒有載入狀態機：tile 是靜態圖，載不出來就是
 * 破圖，跟站上任何一張圖一樣。這正是它相對 R3F 場景最大的成本回收（§3 第 4 點）。
 *
 * 只把「路面」與「主角」當成 ready 的條件：這兩張決定畫面能不能讀，其餘三層
 * 晚到只是背景慢慢補上。
 */
export default function HeroParallax({ running, onReady }: HeroParallaxProps) {
  const [loaded, setLoaded] = useState({ road: false, hero: false });
  const announced = useRef(false);

  const markLoaded = useCallback((key: "road" | "hero") => {
    setLoaded((current) => (current[key] ? current : { ...current, [key]: true }));
  }, []);

  useEffect(() => {
    if (announced.current || !loaded.road || !loaded.hero) return;
    announced.current = true;
    onReady?.();
  }, [loaded, onReady]);

  // 圖片若已在快取裡，onLoad 可能在 React 掛上 handler 之前就發生；掛載後補查 complete。
  const roadImg = useRef<HTMLImageElement>(null);
  const heroImg = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (roadImg.current?.complete && roadImg.current.naturalWidth > 0) markLoaded("road");
    if (heroImg.current?.complete && heroImg.current.naturalWidth > 0) markLoaded("hero");
  }, [markLoaded]);

  const ready = loaded.road && loaded.hero;

  return (
    <div className={styles.band} data-hero-parallax data-running={running} data-ready={ready} aria-hidden="true">
      {PARALLAX_LAYERS.map((layer) => (
        <div key={layer.id} className={`${styles.layer} ${styles[layer.id]}`} style={layerStyle(layer)} data-layer={layer.id}>
          <div className={styles.strip}>
            {Array.from({ length: TILE_COPIES }, (_, copy) => (
              // 平鋪用的 tile 不走 next/image：它要三份等寬並排做 transform 位移，
              // 尺寸由 CSS 變數決定，不需要 srcset；資產已是最終壓縮過的 WebP。
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={copy}
                ref={layer.id === "l3" && copy === 0 ? roadImg : undefined}
                src={`${PARALLAX_ASSET_PATH}/${layer.file}`}
                width={layer.width}
                height={layer.height}
                alt=""
                decoding="async"
                // 路面是 LCP 的一部分，先抓；其餘三層與後兩份副本延後。
                fetchPriority={layer.id === "l3" && copy === 0 ? "high" : "low"}
                loading={copy === 0 ? "eager" : "lazy"}
                onLoad={layer.id === "l3" && copy === 0 ? () => markLoaded("road") : undefined}
                onError={layer.id === "l3" && copy === 0 ? () => markLoaded("road") : undefined}
              />
            ))}
          </div>
        </div>
      ))}
      <div className={styles.heroSlot}>
        {/* 與地圖 roamer 共用同一份 sprite；同上理由不走 next/image。 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={heroImg}
          className={styles.hero}
          src={PARALLAX_HERO_SPRITE.src}
          width={PARALLAX_HERO_SPRITE.width}
          height={PARALLAX_HERO_SPRITE.height}
          alt=""
          decoding="async"
          fetchPriority="high"
          onLoad={() => markLoaded("hero")}
          onError={() => markLoaded("hero")}
        />
      </div>
    </div>
  );
}
