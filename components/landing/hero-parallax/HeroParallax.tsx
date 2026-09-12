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
  /** 路面與主角兩張 LCP 關鍵圖都 settled（載好或失敗）之後呼叫一次。 */
  onReady?: () => void;
  /**
   * true 時所有圖片一律 `loading="lazy"`。首頁覆蓋層（ADR-0004）是 SSR 出來、由
   * CSS 決定顯隱的：閘門關著時它 `display:none`，而 eager 的 `<img>` 就算沒有
   * layout box 瀏覽器也照抓——那會讓明確表達「不要動畫／不要花流量」的人白白
   * 下載 290KB。lazy 圖片沒有 box 就不載；閘門開著時它在視窗內，一樣立刻載。
   */
  deferImages?: boolean;
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
export default function HeroParallax({ running, onReady, deferImages = false }: HeroParallaxProps) {
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

  // SSR 的 <img> 常在 React 掛上 handler 之前就 load 或 error 完（快取命中、或
  // 404 秒回）；掛載後補查 `complete`。失敗也算 settled——破圖就是破圖，不能留一個
  // 永遠等不到的 poster 狀態把出口卡住。
  const roadImg = useRef<HTMLImageElement>(null);
  const heroImg = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (roadImg.current?.complete) markLoaded("road");
    if (heroImg.current?.complete) markLoaded("hero");
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
                srcSet={
                  layer.id === "l3"
                    ? `${PARALLAX_ASSET_PATH}/l3-road-mobile.webp 1200w, ${PARALLAX_ASSET_PATH}/${layer.file} 1630w`
                    : undefined
                }
                sizes={layer.id === "l3" ? "(max-width: 768px) 390px, 100vw" : undefined}
                width={layer.width}
                height={layer.height}
                alt=""
                decoding="async"
                // 只有路面第一份是 eager＋high：它與主角決定畫面能不能讀。其餘 11 張
                // 一律 lazy——實測全部 eager 會跟 hydration 的 JS chunk 搶頻寬，
                // 使用者在 hydration 前點「略過」就變成原生導航。
                fetchPriority={layer.id === "l3" && copy === 0 ? "high" : "low"}
                loading={!deferImages && layer.id === "l3" && copy === 0 ? "eager" : "lazy"}
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
          fetchPriority={deferImages ? "auto" : "high"}
          loading={deferImages ? "lazy" : "eager"}
          onLoad={() => markLoaded("hero")}
          onError={() => markLoaded("hero")}
        />
      </div>
    </div>
  );
}
