"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./StoryPlayer.module.css";

type StoryPlayerProps = {
  title: string;
  color: string;
  images: string[];
  audio: string;
  captions?: string[];
  /** 關閉鈕的去處（預設回首頁） */
  backHref?: string;
};

// 滑動觸發翻頁的最小位移（px）。
const SWIPE_THRESHOLD = 50;

export default function StoryPlayer({
  title,
  color,
  images,
  audio,
  captions,
  backHref = "/",
}: StoryPlayerProps) {
  const [page, setPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mediaError, setMediaError] = useState<"audio" | "image" | null>(null);
  const [playBlocked, setPlayBlocked] = useState(false);
  // 字幕跟讀：播放時依音檔進度自動換句/換頁（繪本朗讀感），預設開啟。
  const [autoFlip, setAutoFlip] = useState(true);

  const audioRef = useRef<HTMLAudioElement>(null);
  const touchStartX = useRef<number | null>(null);

  const total = images.length;
  const caption = captions?.[page];

  function goTo(next: number) {
    setPage(() => Math.max(0, Math.min(total - 1, next)));
  }

  function prev() {
    goTo(page - 1);
  }

  function next() {
    goTo(page + 1);
  }

  // 音檔事件：播放/暫停/結束狀態同步；自動翻頁時依進度推算頁碼。
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const handleEnded = () => setIsPlaying(false);
    const handlePause = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);
    const handleTimeUpdate = () => {
      if (!autoFlip || !el.duration || !Number.isFinite(el.duration)) return;
      const perPage = el.duration / total;
      const target = Math.min(total - 1, Math.floor(el.currentTime / perPage));
      setPage((prev) => (prev === target ? prev : target));
    };

    el.addEventListener("ended", handleEnded);
    el.addEventListener("pause", handlePause);
    el.addEventListener("play", handlePlay);
    el.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      el.removeEventListener("ended", handleEnded);
      el.removeEventListener("pause", handlePause);
      el.removeEventListener("play", handlePlay);
      el.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [autoFlip, total]);

  // 由播放鈕觸發（滿足手機需使用者手勢才能播放的限制）。
  function togglePlay() {
    const el = audioRef.current;
    if (!el || mediaError === "audio") return;

    if (el.paused) {
      setPlayBlocked(false);
      void el.play().catch(() => {
        setIsPlaying(false);
        setPlayBlocked(true);
      });
    } else {
      el.pause();
    }
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (autoFlip) return; // 自動翻頁時關閉手動滑動，避免互相搶頁
    touchStartX.current = e.changedTouches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (autoFlip || touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;
    if (deltaX > 0) {
      prev(); // 往右滑 → 上一頁
    } else {
      next(); // 往左滑 → 下一頁
    }
  }

  return (
    <div
      className={styles.player}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 圖片堆疊，用 opacity 淡入淡出切換 */}
      <div className={styles.stage}>
        {images.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={src}
            alt={`${title} 第 ${i + 1} 頁`}
            className={styles.image}
            style={{ opacity: i === page ? 1 : 0 }}
            draggable={false}
            onError={() => setMediaError("image")}
          />
        ))}
      </div>

      {(mediaError || playBlocked) && (
        <div className={styles.errorBanner} role="alert">
          {mediaError === "image" && "插圖載入失敗，請稍後再試或回上一頁。"}
          {mediaError === "audio" && "音檔載入失敗，請檢查網路後再試。"}
          {!mediaError && playBlocked && "無法播放，請再按一次播放鈕。"}
        </div>
      )}

      {/* 左右透明 tap zone，各佔 35%（自動翻頁時停用） */}
      {!autoFlip && (
        <>
          <button
            className={`${styles.tapZone} ${styles.tapLeft}`}
            onClick={prev}
            aria-label="上一頁"
            type="button"
          />
          <button
            className={`${styles.tapZone} ${styles.tapRight}`}
            onClick={next}
            aria-label="下一頁"
            type="button"
          />
        </>
      )}

      {/* 頂部：關閉鈕 + 標題 + 自動翻頁開關 */}
      <div className={styles.topBar}>
        <Link href={backHref} className={styles.closeBtn} aria-label="關閉">
          ✕
        </Link>
        <span className={styles.topTitle}>{title}</span>
        <button
          className={`${styles.autoBtn} ${autoFlip ? styles.autoBtnOn : ""}`}
          style={autoFlip ? { backgroundColor: color } : undefined}
          onClick={() => setAutoFlip((v) => !v)}
          aria-pressed={autoFlip}
          type="button"
        >
          字幕跟讀 {autoFlip ? "開" : "關"}
        </button>
      </div>

      {/* 字幕：白字 + 半透明圓角底板 */}
      {caption && (
        <div className={styles.captionWrap}>
          <p className={styles.caption}>{caption}</p>
        </div>
      )}

      {/* 底部控制列 */}
      <div className={styles.bottomBar}>
        <button
          className={styles.playBtn}
          style={{ backgroundColor: color }}
          onClick={togglePlay}
          aria-label={isPlaying ? "暫停" : "播放"}
          disabled={mediaError === "audio"}
          type="button"
        >
          {isPlaying ? "❚❚" : "▶"}
        </button>

        <div className={styles.dots}>
          {images.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === page ? styles.dotActive : ""}`}
              style={i === page ? { backgroundColor: color } : undefined}
              onClick={() => !autoFlip && goTo(i)}
              aria-label={`跳到第 ${i + 1} 頁`}
              disabled={autoFlip}
              type="button"
            />
          ))}
        </div>

        <span className={styles.counter}>
          {page + 1}/{total}
        </span>
      </div>

      <audio
        ref={audioRef}
        src={audio}
        preload="metadata"
        onError={() => setMediaError("audio")}
      />
    </div>
  );
}
