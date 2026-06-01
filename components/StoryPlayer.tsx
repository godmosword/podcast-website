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
};

// 滑動觸發翻頁的最小位移（px）。
const SWIPE_THRESHOLD = 50;

export default function StoryPlayer({
  title,
  color,
  images,
  audio,
  captions,
}: StoryPlayerProps) {
  const [page, setPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const touchStartX = useRef<number | null>(null);

  const total = images.length;
  const caption = captions?.[page];

  function goTo(next: number) {
    setPage((prev) => {
      const clamped = Math.max(0, Math.min(total - 1, next));
      return clamped;
    });
  }

  function prev() {
    goTo(page - 1);
  }

  function next() {
    goTo(page + 1);
  }

  // 音檔播放結束自動切回暫停。
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const handleEnded = () => setIsPlaying(false);
    const handlePause = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);

    el.addEventListener("ended", handleEnded);
    el.addEventListener("pause", handlePause);
    el.addEventListener("play", handlePlay);

    return () => {
      el.removeEventListener("ended", handleEnded);
      el.removeEventListener("pause", handlePause);
      el.removeEventListener("play", handlePlay);
    };
  }, []);

  // 由播放鈕觸發（滿足手機需使用者手勢才能播放的限制）。
  function togglePlay() {
    const el = audioRef.current;
    if (!el) return;

    if (el.paused) {
      void el.play().catch(() => {
        // 播放失敗（例如音檔尚未上傳）時保持暫停狀態。
        setIsPlaying(false);
      });
    } else {
      el.pause();
    }
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.changedTouches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
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
            key={src}
            src={src}
            alt={`${title} 第 ${i + 1} 頁`}
            className={styles.image}
            style={{ opacity: i === page ? 1 : 0 }}
            draggable={false}
          />
        ))}
      </div>

      {/* 左右透明 tap zone，各佔 35% */}
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

      {/* 頂部：關閉鈕 + 標題，加漸層遮罩確保白字可讀 */}
      <div className={styles.topBar}>
        <Link href="/" className={styles.closeBtn} aria-label="回首頁">
          ✕
        </Link>
        <span className={styles.topTitle}>{title}</span>
      </div>

      {/* 字幕：若該頁有 caption */}
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
          type="button"
        >
          {isPlaying ? "❚❚" : "▶"}
        </button>

        <div className={styles.dots}>
          {images.map((src, i) => (
            <button
              key={src}
              className={`${styles.dot} ${i === page ? styles.dotActive : ""}`}
              style={i === page ? { backgroundColor: color } : undefined}
              onClick={() => goTo(i)}
              aria-label={`跳到第 ${i + 1} 頁`}
              type="button"
            />
          ))}
        </div>

        <span className={styles.counter}>
          {page + 1}/{total}
        </span>
      </div>

      <audio ref={audioRef} src={audio} preload="auto" />
    </div>
  );
}
