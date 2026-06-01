"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { clearContinue, loadContinue, saveContinue } from "@/lib/continue-playback";
import styles from "./StoryPlayer.module.css";

type StoryPlayerProps = {
  slug: string;
  title: string;
  color: string;
  images: string[];
  audio: string;
  captions?: string[];
  backHref?: string;
  nextStorySlug?: string;
  nextStoryTitle?: string;
};

const SWIPE_THRESHOLD = 50;
const BEDTIME_OPTIONS = [15, 30, 45] as const;

export default function StoryPlayer({
  slug,
  title,
  color,
  images,
  audio,
  captions,
  backHref = "/",
  nextStorySlug,
  nextStoryTitle,
}: StoryPlayerProps) {
  const [page, setPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mediaError, setMediaError] = useState<"audio" | "image" | null>(null);
  const [playBlocked, setPlayBlocked] = useState(false);
  const [autoFlip, setAutoFlip] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasEnded, setHasEnded] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [bedtimeMinutes, setBedtimeMinutes] = useState<number | null>(null);
  const [bedtimeRemaining, setBedtimeRemaining] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);
  const touchStartX = useRef<number | null>(null);
  const bedtimeEndRef = useRef<number | null>(null);

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

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.ready.then((reg) => {
      reg.active?.postMessage({ type: "CACHE_STORY", urls: [audio, ...images] });
    });
  }, [audio, images]);

  useEffect(() => {
    const saved = loadContinue();
    if (saved?.slug === slug && saved.page < total) {
      setPage(saved.page);
      const el = audioRef.current;
      if (el && saved.time > 0) {
        el.currentTime = saved.time;
      }
    }
  }, [slug, total]);

  useEffect(() => {
    if (!isPlaying && !hasEnded) return;
    saveContinue({ slug, page, time: audioRef.current?.currentTime ?? 0 });
  }, [slug, page, isPlaying, hasEnded]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const handleEnded = () => {
      setIsPlaying(false);
      setHasEnded(true);
      clearContinue();
    };
    const handlePause = () => setIsPlaying(false);
    const handlePlay = () => {
      setIsPlaying(true);
      setHasEnded(false);
      setPlayBlocked(false);
    };
    const handleTimeUpdate = () => {
      if (el.duration && Number.isFinite(el.duration)) {
        setProgress((el.currentTime / el.duration) * 100);
      }
      if (!autoFlip || !el.duration || !Number.isFinite(el.duration)) return;
      const perPage = el.duration / total;
      const target = Math.min(total - 1, Math.floor(el.currentTime / perPage));
      setPage((prev) => (prev === target ? prev : target));
    };
    const handleCanPlay = () => setIsLoading(false);
    const handleLoadStart = () => setIsLoading(true);

    el.addEventListener("ended", handleEnded);
    el.addEventListener("pause", handlePause);
    el.addEventListener("play", handlePlay);
    el.addEventListener("timeupdate", handleTimeUpdate);
    el.addEventListener("canplay", handleCanPlay);
    el.addEventListener("loadstart", handleLoadStart);

    return () => {
      el.removeEventListener("ended", handleEnded);
      el.removeEventListener("pause", handlePause);
      el.removeEventListener("play", handlePlay);
      el.removeEventListener("timeupdate", handleTimeUpdate);
      el.removeEventListener("canplay", handleCanPlay);
      el.removeEventListener("loadstart", handleLoadStart);
    };
  }, [autoFlip, total]);

  useEffect(() => {
    if (bedtimeMinutes === null) {
      bedtimeEndRef.current = null;
      setBedtimeRemaining(null);
      return;
    }

    bedtimeEndRef.current = Date.now() + bedtimeMinutes * 60_000;
    const tick = () => {
      const end = bedtimeEndRef.current;
      if (!end) return;
      const remaining = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setBedtimeRemaining(remaining);
      if (remaining <= 0) {
        audioRef.current?.pause();
        setIsPlaying(false);
        setHasEnded(true);
        setBedtimeMinutes(null);
      }
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [bedtimeMinutes]);

  function togglePlay() {
    const el = audioRef.current;
    if (!el || mediaError === "audio") return;

    if (hasEnded) {
      el.currentTime = 0;
      setPage(0);
      setHasEnded(false);
    }

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

  function replay() {
    const el = audioRef.current;
    if (!el) return;
    setHasEnded(false);
    setPage(0);
    el.currentTime = 0;
    void el.play().catch(() => setPlayBlocked(true));
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (autoFlip || hasEnded) return;
    touchStartX.current = e.changedTouches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (autoFlip || hasEnded || touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;
    if (deltaX > 0) prev();
    else next();
  }

  function formatBedtime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  return (
    <div
      className={styles.player}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className={styles.stage}>
        {isLoading && (
          <div className={styles.skeleton} aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={images[0]} alt="" className={styles.skeletonImage} />
          </div>
        )}
        {images.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={src}
            alt={`${title} 第 ${i + 1} 頁`}
            className={styles.image}
            style={{ opacity: i === page && !hasEnded ? 1 : 0 }}
            draggable={false}
            onLoad={() => i === 0 && setIsLoading(false)}
            onError={() => setMediaError("image")}
          />
        ))}
      </div>

      {hasEnded && (
        <div className={styles.endScreen}>
          <p className={styles.endTitle}>故事聽完囉 🌙</p>
          <p className={styles.endSubtitle}>{title}</p>
          <div className={styles.endActions}>
            <button
              type="button"
              className={styles.endBtn}
              style={{ backgroundColor: color }}
              onClick={replay}
            >
              再聽一次
            </button>
            <Link href={backHref} className={styles.endBtnSecondary}>
              回故事屋
            </Link>
            {nextStorySlug && nextStoryTitle && (
              <Link
                href={`/story/${nextStorySlug}/play`}
                className={styles.endBtnSecondary}
              >
                下一集：{nextStoryTitle}
              </Link>
            )}
          </div>
        </div>
      )}

      {(mediaError || playBlocked) && !hasEnded && (
        <div className={styles.errorBanner} role="alert">
          {mediaError === "image" && "插圖載入失敗，請稍後再試或回上一頁。"}
          {mediaError === "audio" && "音檔載入失敗，請檢查網路後再試。"}
          {!mediaError && playBlocked && "無法播放，請再按一次播放鈕。"}
        </div>
      )}

      {!autoFlip && !hasEnded && (
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

      {!hasEnded && (
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
      )}

      {bedtimeRemaining !== null && !hasEnded && (
        <div className={styles.bedtimeBadge}>
          睡前 {formatBedtime(bedtimeRemaining)}
        </div>
      )}

      {caption && !hasEnded && (
        <div className={styles.captionWrap}>
          <p className={styles.caption}>{caption}</p>
        </div>
      )}

      {!hasEnded && (
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

          <div className={styles.dotsWrap}>
            {autoFlip && (
              <p className={styles.autoHint} id="auto-flip-hint">
                跟讀中會自動翻頁喔
              </p>
            )}
            <div className={styles.dots} aria-describedby={autoFlip ? "auto-flip-hint" : undefined}>
              {images.map((_, i) => (
                <button
                  key={i}
                  className={`${styles.dot} ${i === page ? styles.dotActive : ""}`}
                  style={i === page ? { backgroundColor: color } : undefined}
                  onClick={() => !autoFlip && goTo(i)}
                  aria-label={`跳到第 ${i + 1} 頁`}
                  disabled={autoFlip}
                  title={autoFlip ? "跟讀中會自動翻頁" : undefined}
                  type="button"
                />
              ))}
            </div>
          </div>

          <span className={styles.counter}>
            {page + 1}/{total}
          </span>
        </div>
      )}

      {!hasEnded && (
        <div className={styles.advancedBar}>
          <button
            type="button"
            className={styles.advancedToggle}
            onClick={() => setShowAdvanced((v) => !v)}
            aria-expanded={showAdvanced}
          >
            家長設定 {showAdvanced ? "▲" : "▼"}
          </button>
          {showAdvanced && (
            <div className={styles.advancedPanel}>
              <p className={styles.advancedLabel}>睡前定時</p>
              <div className={styles.bedtimeOptions}>
                {BEDTIME_OPTIONS.map((min) => (
                  <button
                    key={min}
                    type="button"
                    className={`${styles.bedtimeBtn} ${bedtimeMinutes === min ? styles.bedtimeBtnActive : ""}`}
                    onClick={() =>
                      setBedtimeMinutes((current) =>
                        current === min ? null : min,
                      )
                    }
                  >
                    {min} 分
                  </button>
                ))}
              </div>
              {showAdvanced && (
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={progress}
                  className={styles.seekBar}
                  aria-label="播放進度"
                  onChange={(e) => {
                    const el = audioRef.current;
                    if (!el?.duration) return;
                    el.currentTime = (Number(e.target.value) / 100) * el.duration;
                  }}
                />
              )}
            </div>
          )}
        </div>
      )}

      <audio
        ref={audioRef}
        src={audio}
        preload="metadata"
        onError={() => setMediaError("audio")}
      />
    </div>
  );
}
