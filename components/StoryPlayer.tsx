"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { clearContinue, loadContinue, saveContinue } from "@/lib/continue-playback";
import Wheel from "./decor/Wheel";
import Sparkle from "./decor/Sparkle";
import decor from "./decor/decor.module.css";
import styles from "./StoryPlayer.module.css";

type StoryPlayerProps = {
  slug: string;
  title: string;
  color: string;
  images: string[];
  audio: string;
  captions?: string[];
  /** 即時字幕：每句起始秒數，與頁數一一對應且遞增。 */
  captionTimes?: number[];
  backHref?: string;
  nextStorySlug?: string;
  nextStoryTitle?: string;
};

const SWIPE_THRESHOLD = 50;
const BEDTIME_OPTIONS = [15, 30, 45] as const;

/**
 * 即時字幕定位：回傳 currentTime 當下應顯示的句子索引（最後一個起始秒數 ≤ t 的句子）。
 * times 需遞增；回傳值夾在 [0, max]。
 */
function activeCueIndex(times: number[], t: number, max: number): number {
  let idx = 0;
  for (let i = 0; i < times.length; i += 1) {
    if (t >= times[i]) idx = i;
    else break;
  }
  return Math.min(idx, Math.max(0, max));
}

export default function StoryPlayer({
  slug,
  title,
  color,
  images,
  audio,
  captions,
  captionTimes,
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
  const [cueMode, setCueMode] = useState(false);
  const [cueMarks, setCueMarks] = useState<number[]>([]);
  const [cueCopied, setCueCopied] = useState(false);
  const [cueNow, setCueNow] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);
  const touchStartX = useRef<number | null>(null);
  const bedtimeEndRef = useRef<number | null>(null);

  const total = images.length;
  const caption = captions?.[page];
  // 有提供且句數對得上時，啟用即時字幕（精準秒數換句）；否則回退時長平均切換。
  const hasCueTimes =
    Array.isArray(captionTimes) && captionTimes.length === total;

  // 字幕對時模式：播放頁網址帶 ?cue=1 時啟用（純客戶端偵測，頁面維持 SSG）。
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("cue") === "1") {
      setCueMode(true);
    }
  }, []);

  // 對時模式：每 100ms 更新目前秒數顯示（不影響正常播放路徑）。
  useEffect(() => {
    if (!cueMode) return;
    const id = window.setInterval(() => {
      setCueNow(audioRef.current?.currentTime ?? 0);
    }, 100);
    return () => window.clearInterval(id);
  }, [cueMode]);

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
      if (!autoFlip) return;
      let target: number | null = null;
      if (hasCueTimes) {
        // 即時字幕：用每句起始秒數精準定位（插圖也跟著準）。
        target = activeCueIndex(captionTimes!, el.currentTime, total - 1);
      } else if (el.duration && Number.isFinite(el.duration)) {
        // 回退：時長平均切換。
        const perPage = el.duration / total;
        target = Math.min(total - 1, Math.floor(el.currentTime / perPage));
      }
      if (target !== null) {
        setPage((prev) => (prev === target ? prev : target));
      }
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
  }, [autoFlip, total, hasCueTimes, captionTimes]);

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

  // ---- 字幕對時模式：邊聽邊記下每句起始秒數 ----
  function markCue() {
    const t = audioRef.current?.currentTime ?? 0;
    setCueMarks((m) => [...m, Math.round(t * 10) / 10]);
    setCueCopied(false);
  }

  function undoCue() {
    setCueMarks((m) => m.slice(0, -1));
    setCueCopied(false);
  }

  function resetCue() {
    setCueMarks([]);
    setCueCopied(false);
  }

  async function copyCue() {
    const text = `captionTimes: [${cueMarks.join(", ")}],`;
    try {
      await navigator.clipboard.writeText(text);
      setCueCopied(true);
    } catch {
      // 剪貼簿不可用時靜默：使用者仍可手動從畫面複製。
    }
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
            <Wheel
              size={52}
              color="#fff"
              className={`${styles.spinner} ${decor.spin}`}
            />
          </div>
        )}
        {images.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={src}
            alt={`${title} 第 ${i + 1} 頁`}
            aria-hidden={i !== page}
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
          <Sparkle
            className={`${styles.endSparkle} ${styles.endSparkle1} ${decor.sparkleAnim}`}
            size={26}
          />
          <Sparkle
            className={`${styles.endSparkle} ${styles.endSparkle2} ${decor.sparkleAnim}`}
            size={18}
          />
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

      {cueMode && !hasEnded && (
        <div className={styles.cuePanel} role="region" aria-label="字幕對時模式">
          <div className={styles.cueHead}>
            <span className={styles.cueNow}>{cueNow.toFixed(1)}s</span>
            <span className={styles.cueCount}>
              已記 {cueMarks.length}/{captions?.length ?? total} 句
            </span>
          </div>
          <button
            type="button"
            className={styles.cueMark}
            style={{ backgroundColor: color }}
            onClick={markCue}
          >
            ⏱ 記下這一句（第 {cueMarks.length + 1} 句）
          </button>
          <code className={styles.cueOut}>
            captionTimes: [{cueMarks.join(", ")}],
          </code>
          <div className={styles.cueBtns}>
            <button type="button" onClick={undoCue} disabled={cueMarks.length === 0}>
              復原
            </button>
            <button type="button" onClick={resetCue} disabled={cueMarks.length === 0}>
              清除
            </button>
            <button type="button" onClick={copyCue} disabled={cueMarks.length === 0}>
              {cueCopied ? "已複製 ✓" : "複製"}
            </button>
          </div>
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
