"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { clearContinue, loadContinue, saveContinue } from "@/lib/continue-playback";
import { useTheme } from "@/components/ThemeProvider";
import {
  getCaptionSizeFromStore,
  getNightPromptDismissedFromStore,
  setCaptionSizeInStore,
  setNightPromptDismissedInStore,
  type CaptionSize,
} from "@/lib/progress-store";
import { LIGHT_THEME, NIGHT_THEME } from "@/lib/theme";
import { recordStoryCompleted } from "@/lib/engagement";
import { playSfx, isSfxEnabled } from "@/lib/sfx";
import SfxToggle from "./SfxToggle";

// 結尾才出現的反思卡 / 僅 ?cue=1 的對時面板：動態載入，縮小播放器主 chunk。
const ReflectionPrompt = dynamic(
  () => import("@/components/story/ReflectionPrompt"),
  { ssr: false },
);
const StoryCuePanel = dynamic(() => import("./StoryCuePanel"), { ssr: false });
import Wheel from "./decor/Wheel";
import Sparkle from "./decor/Sparkle";
import {
  CaptionsIcon,
  RepeatIcon,
  RewindIcon,
  ForwardIcon,
  StopIcon,
  PlayGlyph,
  PauseGlyph,
} from "./decor/PlayerIcon";
import decor from "./decor/decor.module.css";
import styles from "./StoryPlayer.module.css";

export type StoryPlayerProps = {
  slug: string;
  title: string;
  color: string;
  images: string[];
  audio: string;
  captions?: string[];
  /** 即時字幕（舊式）：每句起始秒數，與頁數一一對應且遞增。 */
  captionTimes?: number[];
  /** 即時字幕軌（轉錄產生）：獨立於翻頁，依音檔時間顯示。 */
  subtitles?: { t: number; text: string }[];
  backHref?: string;
  nextStorySlug?: string;
  nextStoryTitle?: string;
  reflectionPrompt?: {
    child: string;
    parentFollowUp: string;
  };
};

const SWIPE_THRESHOLD = 50;
const SKIP_SECONDS = 10;
const BEDTIME_OPTIONS = [15, 30, 45] as const;

function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

// 字幕字級偏好（跨集保留於 progress-store）。
const CAPTION_SIZES = ["sm", "md", "lg"] as const;
const CAPTION_SIZE_LABEL: Record<CaptionSize, string> = {
  sm: "小",
  md: "中",
  lg: "大",
};

function isCaptionSize(v: unknown): v is CaptionSize {
  return typeof v === "string" && (CAPTION_SIZES as readonly string[]).includes(v);
}

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
  subtitles,
  backHref = "/",
  nextStorySlug,
  nextStoryTitle,
  reflectionPrompt,
}: StoryPlayerProps) {
  const [page, setPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mediaError, setMediaError] = useState<"audio" | "image" | null>(null);
  const [playBlocked, setPlayBlocked] = useState(false);
  const [subtitlesOn, setSubtitlesOn] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasEnded, setHasEnded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [repeat, setRepeat] = useState(false);
  const [bedtimeMinutes, setBedtimeMinutes] = useState<number | null>(null);
  const [bedtimeRemaining, setBedtimeRemaining] = useState<number | null>(null);
  const [showTimer, setShowTimer] = useState(false);
  const [showNightPrompt, setShowNightPrompt] = useState(false);
  const { theme, setMode } = useTheme();
  const [cueMode, setCueMode] = useState(false);
  const [cueMarks, setCueMarks] = useState<number[]>([]);
  const [cueCopied, setCueCopied] = useState(false);
  const [cueNow, setCueNow] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [captionSize, setCaptionSize] = useState<CaptionSize>("md");

  const audioRef = useRef<HTMLAudioElement>(null);
  const transportRef = useRef<{
    togglePlay: () => void;
    skip: (delta: number) => void;
  }>({ togglePlay: () => {}, skip: () => {} });
  const touchStartX = useRef<number | null>(null);
  const bedtimeEndRef = useRef<number | null>(null);
  const timerWrapRef = useRef<HTMLDivElement>(null);
  const completionRecorded = useRef(false);

  const total = images.length;
  const hasSubtitles = Array.isArray(subtitles) && subtitles.length > 0;
  const hasCueTimes =
    Array.isArray(captionTimes) && captionTimes.length === total;
  // 有側車字幕時逐句顯示；無字幕時用 captions（每幕一句摘要）＋ captionTimes 換頁。
  const sceneCaptions =
    !hasSubtitles &&
    Array.isArray(captions) &&
    captions.length === total &&
    hasCueTimes;
  const caption = hasSubtitles
    ? subtitles![subIndex]?.text
    : sceneCaptions
      ? captions![page]
      : captions?.[page];

  // 字幕對時模式：播放頁網址帶 ?cue=1 時啟用（純客戶端偵測，頁面維持 SSG）。
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("cue") === "1") {
      setCueMode(true);
    }
  }, []);

  // 還原字幕字級偏好（SSR 初值固定 md，掛載後才讀，避免 hydration mismatch）。
  useEffect(() => {
    try {
      const saved = getCaptionSizeFromStore();
      if (isCaptionSize(saved)) setCaptionSize(saved);
    } catch {
      // store 不可用時維持預設。
    }
  }, []);

  function cycleCaptionSize() {
    setCaptionSize((cur) => {
      const idx = CAPTION_SIZES.indexOf(cur);
      const next = CAPTION_SIZES[(idx + 1) % CAPTION_SIZES.length];
      try {
        setCaptionSizeInStore(next);
      } catch {
        // 寫入失敗時不阻斷切換，僅本次有效。
      }
      return next;
    });
  }

  // 對時模式：每 100ms 更新目前秒數顯示（不影響正常播放路徑）。
  useEffect(() => {
    if (!cueMode) return;
    const id = window.setInterval(() => {
      setCueNow(audioRef.current?.currentTime ?? 0);
    }, 100);
    return () => window.clearInterval(id);
  }, [cueMode]);

  // 睡前定時選單：點選單外或按 Esc 自動收起。
  useEffect(() => {
    if (!showTimer) return;
    const onDown = (e: PointerEvent) => {
      if (!timerWrapRef.current?.contains(e.target as Node)) setShowTimer(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowTimer(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [showTimer]);

  function goTo(next: number) {
    setPage(() => Math.max(0, Math.min(total - 1, next)));
  }

  function prev() {
    playSfx("flip");
    goTo(page - 1);
  }

  function next() {
    playSfx("flip");
    goTo(page + 1);
  }

  useEffect(() => {
    const el = audioRef.current;
    if (el) el.muted = !isSfxEnabled();
  }, [audio]);

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
      if (repeat) {
        el.currentTime = 0;
        setPage(0);
        void el.play().catch(() => setIsPlaying(false));
        return;
      }
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
    const subTimes = hasSubtitles ? subtitles!.map((s) => s.t) : null;
    const handleTimeUpdate = () => {
      const t = el.currentTime;
      setCurrentTime(t);
      if (el.duration && Number.isFinite(el.duration)) {
        setDuration(el.duration);
        setProgress((t / el.duration) * 100);
      }
      // 即時字幕軌：獨立於翻頁，永遠跟讀。
      if (subTimes) {
        const si = activeCueIndex(subTimes, t, subTimes.length - 1);
        setSubIndex((prev) => (prev === si ? prev : si));
      }
      if (!subtitlesOn) return;
      // 翻頁定位。
      let target: number | null = null;
      if (hasCueTimes) {
        target = activeCueIndex(captionTimes!, t, total - 1);
      } else if (el.duration && Number.isFinite(el.duration)) {
        const perPage = el.duration / total;
        target = Math.min(total - 1, Math.floor(t / perPage));
      }
      if (target !== null) {
        setPage((prev) => (prev === target ? prev : target));
      }
    };
    const handleCanPlay = () => {
      setIsLoading(false);
      if (el.duration && Number.isFinite(el.duration)) setDuration(el.duration);
    };
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
  }, [subtitlesOn, total, hasCueTimes, captionTimes, hasSubtitles, subtitles, repeat]);

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

  function formatBedtime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function formatTime(sec: number): string {
    const v = Number.isFinite(sec) && sec > 0 ? sec : 0;
    const m = Math.floor(v / 60);
    const s = Math.floor(v % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function skip(delta: number) {
    const el = audioRef.current;
    if (!el) return;
    const dur = Number.isFinite(el.duration) ? el.duration : el.currentTime + delta;
    el.currentTime = Math.max(0, Math.min(dur, el.currentTime + delta));
  }

  function stop() {
    const el = audioRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
    setPage(0);
    setIsPlaying(false);
  }

  function togglePlay() {
    const el = audioRef.current;
    if (!el || mediaError === "audio") return;
    playSfx("tap");

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

  transportRef.current = { togglePlay, skip };

  useEffect(() => {
    if (!hasEnded) return;
    if (completionRecorded.current) return;
    completionRecorded.current = true;
    recordStoryCompleted(slug);
  }, [hasEnded, slug]);

  // 鍵盤：空白鍵播放/暫停，左右方向鍵 ±10 秒（與控制列一致）。
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditableKeyboardTarget(e.target)) return;

      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        transportRef.current.togglePlay();
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        transportRef.current.skip(-SKIP_SECONDS);
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        transportRef.current.skip(SKIP_SECONDS);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function replay() {
    const el = audioRef.current;
    if (!el) return;
    completionRecorded.current = false;
    setHasEnded(false);
    setPage(0);
    el.currentTime = 0;
    void el.play().catch(() => setPlayBlocked(true));
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (subtitlesOn || hasEnded) return;
    touchStartX.current = e.changedTouches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (subtitlesOn || hasEnded || touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;
    if (deltaX > 0) prev();
    else next();
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
      <audio
        ref={audioRef}
        src={audio}
        preload="metadata"
        onError={() => setMediaError("audio")}
      />
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
        {images.map((src, i) => {
          // 只掛載目前頁與左右相鄰頁，避免多頁故事一次塞入並下載全部插圖。
          // 翻頁多為循序，相鄰預掛載即可保留淡入淡出；遠距跳頁時靠 loading 骨架過渡。
          if (Math.abs(i - page) > 1) return null;
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt={`${title} 第 ${i + 1} 頁`}
              aria-hidden={i !== page}
              className={styles.image}
              style={{ opacity: i === page && !hasEnded ? 1 : 0 }}
              draggable={false}
              loading={i === page ? "eager" : "lazy"}
              decoding="async"
              onLoad={() => i === page && setIsLoading(false)}
              onError={() => setMediaError("image")}
            />
          );
        })}
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
          {reflectionPrompt && (
            <ReflectionPrompt
              slug={slug}
              child={reflectionPrompt.child}
              parentFollowUp={reflectionPrompt.parentFollowUp}
              accent={color}
              compact
            />
          )}
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

      {!subtitlesOn && !hasEnded && (
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
          <h1 className={styles.topTitle}>{title}</h1>
          <div className={styles.topBarTools}>
          <div className={styles.timerWrap} ref={timerWrapRef}>
            <button
              type="button"
              className={`${styles.timerBtn} ${bedtimeMinutes ? styles.timerBtnOn : ""}`}
              onClick={() => setShowTimer((v) => !v)}
              aria-label="睡前定時"
              aria-expanded={showTimer}
            >
              ⏱
              {bedtimeRemaining !== null ? ` ${formatBedtime(bedtimeRemaining)}` : ""}
            </button>
            {showTimer && (
              <div className={styles.timerMenu} role="menu">
                {BEDTIME_OPTIONS.map((min) => (
                  <button
                    key={min}
                    type="button"
                    role="menuitemradio"
                    aria-checked={bedtimeMinutes === min}
                    className={`${styles.timerOpt} ${bedtimeMinutes === min ? styles.timerOptOn : ""}`}
                    onClick={() => {
                      setBedtimeMinutes((c) => {
                        const next = c === min ? null : min;
                        if (
                          next !== null &&
                          c === null &&
                          !getNightPromptDismissedFromStore() &&
                          theme === LIGHT_THEME
                        ) {
                          setShowNightPrompt(true);
                        }
                        return next;
                      });
                      setShowTimer(false);
                    }}
                  >
                    睡前 {min} 分
                  </button>
                ))}
                {bedtimeMinutes !== null && (
                  <button
                    type="button"
                    className={styles.timerOpt}
                    onClick={() => {
                      setBedtimeMinutes(null);
                      setShowTimer(false);
                    }}
                  >
                    取消定時
                  </button>
                )}
              </div>
            )}
            {showNightPrompt && (
              <div className={styles.nightPrompt} role="dialog" aria-label="夜晚模式提示">
                <p className={styles.nightPromptText}>要進入夜晚模式嗎？</p>
                <div className={styles.nightPromptActions}>
                  <button
                    type="button"
                    className={styles.nightPromptYes}
                    onClick={() => {
                      setMode(NIGHT_THEME);
                      setNightPromptDismissedInStore(true);
                      setShowNightPrompt(false);
                    }}
                  >
                    好呀
                  </button>
                  <button
                    type="button"
                    className={styles.nightPromptNo}
                    onClick={() => {
                      setNightPromptDismissedInStore(true);
                      setShowNightPrompt(false);
                    }}
                  >
                    不用了
                  </button>
                </div>
              </div>
            )}
          </div>
          <SfxToggle className={styles.sfxBtn} audioRef={audioRef} />
          <button
            type="button"
            className={styles.captionSizeBtn}
            onClick={cycleCaptionSize}
            aria-label={`字幕字級：${CAPTION_SIZE_LABEL[captionSize]}（點擊切換）`}
          >
            <span className={styles.aaSmall}>A</span>
            <span className={styles.aaLarge}>A</span>
          </button>
          <button
            className={subtitlesOn ? styles.subtitlesBtnOn : styles.subtitlesBtn}
            style={subtitlesOn ? { backgroundColor: color } : undefined}
            onClick={() => setSubtitlesOn((v) => !v)}
            aria-pressed={subtitlesOn}
            aria-label={subtitlesOn ? "字幕：開" : "字幕：關"}
            type="button"
          >
            <CaptionsIcon size={22} />
            <span className={styles.subtitlesLabel}>字幕</span>
          </button>
          </div>
        </div>
      )}

      {cueMode && !hasEnded && (
        <StoryCuePanel
          color={color}
          cueNow={cueNow}
          cueMarks={cueMarks}
          captionCount={captions?.length ?? total}
          cueCopied={cueCopied}
          onMark={markCue}
          onUndo={undoCue}
          onReset={resetCue}
          onCopy={copyCue}
        />
      )}

      {subtitlesOn && caption && !hasEnded && (
        <div className={styles.captionWrap} data-size={captionSize}>
          <p className={styles.caption}>{caption}</p>
        </div>
      )}

      {!hasEnded && (
        <div className={styles.controls}>
          <div className={styles.controlsInner}>
            <div className={styles.seekRow}>
              <span className={styles.time}>{formatTime(currentTime)}</span>
              <input
                type="range"
                min={0}
                max={100}
                step={0.1}
                value={progress}
                className={styles.seekBar}
                style={
                  {
                    "--seek": `${progress}%`,
                    "--seek-color": color,
                  } as React.CSSProperties
                }
                aria-label="播放進度"
                onChange={(e) => {
                  const el = audioRef.current;
                  if (!el?.duration) return;
                  el.currentTime = (Number(e.target.value) / 100) * el.duration;
                }}
              />
              <span className={styles.time}>{formatTime(duration)}</span>
            </div>

            <div className={styles.transport}>
              <button
                type="button"
                className={`${styles.ctrlBtn} ${repeat ? styles.ctrlBtnOn : ""}`}
                style={repeat ? { color } : undefined}
                onClick={() => setRepeat((v) => !v)}
                aria-pressed={repeat}
                aria-label="重複播放"
              >
                <RepeatIcon size={34} />
                {repeat && <span className={styles.onDot} style={{ backgroundColor: color }} />}
              </button>
              <button
                type="button"
                className={styles.ctrlBtn}
                onClick={() => skip(-SKIP_SECONDS)}
                aria-label="倒退 10 秒"
                disabled={mediaError === "audio"}
              >
                <span className={styles.skip}>
                  <RewindIcon size={36} />
                  <span className={styles.skipNum}>10</span>
                </span>
              </button>
              <button
                className={styles.playBtn}
                style={{ backgroundColor: color }}
                onClick={togglePlay}
                aria-label={isPlaying ? "暫停" : "播放"}
                disabled={mediaError === "audio"}
                type="button"
              >
                {isPlaying ? (
                  <PauseGlyph size={32} />
                ) : (
                  <PlayGlyph size={32} className={styles.playGlyph} />
                )}
              </button>
              <button
                type="button"
                className={styles.ctrlBtn}
                onClick={() => skip(SKIP_SECONDS)}
                aria-label="快進 10 秒"
                disabled={mediaError === "audio"}
              >
                <span className={styles.skip}>
                  <ForwardIcon size={36} />
                  <span className={styles.skipNum}>10</span>
                </span>
              </button>
              <button
                type="button"
                className={styles.ctrlBtn}
                onClick={stop}
                aria-label="停止"
                disabled={mediaError === "audio"}
              >
                <StopIcon size={32} />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
