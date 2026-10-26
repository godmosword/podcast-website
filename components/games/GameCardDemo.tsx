"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { PieceArt } from "@/components/games/CandyMatchPieceArt";
import type { GameMeta } from "@/data/games";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { dinoSushiSrc } from "@/lib/games/dino-sushi/asset-src";
import styles from "./GameCardDemo.module.css";

/** 一段示範的長度；CSS 的 --demo-ms 由這裡寫進去，只有這一個地方定義。 */
const GAME_CARD_DEMO_MS = 2100;
/** 兩段示範之間至少隔多久：桌機三張卡同時進畫面時依序播，同一時間只有一段在動。 */
const DEMO_GAP_MS = 300;
/** 卡片進到畫面多少才播（避免捲過去的瞬間就播完）。 */
const VISIBLE_RATIO = 0.6;
/** 滑鼠停在卡上多久才重播：掃過整排卡片不會一直觸發。 */
const HOVER_DWELL_MS = 150;
/** 同時進畫面的幾張卡，請求先收齊這麼久，再依頁面上的順序（左到右、上到下）排。 */
const BATCH_MS = 80;

/** 全頁共用的播放排程：每段示範預約一個時段，下一段排在所有已預約時段之後。 */
const reservations = new Set<{ end: number }>();

/**
 * 預約一段示範。回傳的函式會取消還沒開始的播放並釋放時段（卡片卸載、離開頁面時呼叫），
 * client 導航回來時不會因為舊頁面留下的預約而多等。時段播完也會自己釋放。
 */
function schedule(play: () => void): () => void {
  const now = performance.now();
  const start = Math.max(now, ...[...reservations].map((r) => r.end));
  const slot = { end: start + GAME_CARD_DEMO_MS + DEMO_GAP_MS };
  reservations.add(slot);
  const playTimer = window.setTimeout(play, start - now);
  const releaseTimer = window.setTimeout(() => reservations.delete(slot), slot.end - now);
  return () => {
    window.clearTimeout(playTimer);
    window.clearTimeout(releaseTimer);
    reservations.delete(slot);
  };
}

type PendingRequest = { el: HTMLElement; play: () => void; cancel: (() => void) | null; cancelled: boolean };
let batch: PendingRequest[] = [];
let batchTimer = 0;

function flushBatch() {
  batchTimer = 0;
  const list = batch
    .filter((r) => !r.cancelled)
    .sort((a, b) => (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  batch = [];
  for (const r of list) r.cancel = schedule(r.play);
}

/** 排進下一批；回傳取消（還在批次裡就直接丟掉，已排程就釋放時段）。 */
function enqueue(el: HTMLElement, play: () => void): () => void {
  const request: PendingRequest = { el, play, cancel: null, cancelled: false };
  batch.push(request);
  if (!batchTimer) batchTimer = window.setTimeout(flushBatch, BATCH_MS);
  return () => {
    request.cancelled = true;
    request.cancel?.();
  };
}

/**
 * 遊樂園卡片封面上的一小段玩法示範（10 月待辦 4，K-18）：卡片進到畫面時播一次，播完整層淡掉、
 * 最後一格是乾淨的封面；滑鼠停在卡上或鍵盤聚焦時重播（播的中途不重來）。減少動態不播。
 * 動作發生在封面裡原本該發生的地方，避開主角和右下的玩法鈕。不加圖：用遊戲裡現有的黏土食材、
 * 消消樂的車車棋子與 CSS 圖形。播的時候卡片標 data-demo-playing，首張卡的玩法鈕呼吸先停。
 */
export function GameCardDemo({ gameType }: { gameType: GameMeta["gameType"] }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  /** 第幾次播放；換數字會重掛示範，CSS 動畫從頭來。 */
  const [run, setRun] = useState(0);
  const [playing, setPlaying] = useState(false);
  const playingRef = useRef(false);
  const Demo = DEMOS[gameType];

  // 播到一半切成減少動態：示範節點會被拿掉、收不到 animationend，這裡直接收掉
  useEffect(() => {
    if (!reduced) return;
    playingRef.current = false;
    setPlaying(false);
  }, [reduced]);

  useEffect(() => {
    playingRef.current = playing;
    const card = ref.current?.closest<HTMLElement>("a");
    if (!card) return;
    if (playing) card.setAttribute("data-demo-playing", "");
    else card.removeAttribute("data-demo-playing");
  }, [playing]);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || !Demo) return;
    const card = el.closest<HTMLElement>("a");
    /** 這張卡目前預約的時段（等待中或播放中）；播完或卸載時釋放。 */
    let release: (() => void) | null = null;
    let pending = false;
    let dwell = 0;
    const request = () => {
      if (playingRef.current || pending) return;
      release?.();
      pending = true;
      release = enqueue(el, () => {
        pending = false;
        playingRef.current = true;
        setPlaying(true);
        setRun((n) => n + 1);
      });
    };
    let seen = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (seen || !entries.some((e) => e.isIntersecting && e.intersectionRatio >= VISIBLE_RATIO)) return;
        seen = true;
        io.disconnect();
        request();
      },
      { threshold: VISIBLE_RATIO },
    );
    io.observe(el);
    // 觸控的 pointerenter 跟著點擊一起來（點了就換頁），只認滑鼠
    const onPointerEnter = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      window.clearTimeout(dwell);
      dwell = window.setTimeout(request, HOVER_DWELL_MS);
    };
    const onPointerLeave = () => window.clearTimeout(dwell);
    const onFocus = () => request();
    card?.addEventListener("pointerenter", onPointerEnter);
    card?.addEventListener("pointerleave", onPointerLeave);
    card?.addEventListener("focus", onFocus);
    return () => {
      io.disconnect();
      window.clearTimeout(dwell);
      release?.();
      card?.removeEventListener("pointerenter", onPointerEnter);
      card?.removeEventListener("pointerleave", onPointerLeave);
      card?.removeEventListener("focus", onFocus);
    };
  }, [Demo, reduced]);

  return (
    <span ref={ref} className={styles.layer} aria-hidden>
      {Demo && playing && !reduced ? (
        <span
          key={run}
          className={styles.life}
          data-demo={gameType}
          style={{ "--demo-ms": `${GAME_CARD_DEMO_MS}ms` } as CSSProperties}
          onAnimationEnd={(e) => {
            if (e.target !== e.currentTarget) return;
            playingRef.current = false;
            setPlaying(false);
          }}
        >
          <Demo />
        </span>
      ) : null}
    </span>
  );
}

/** 「做對了」的星光：三段示範同一個樣子、同一個時間點，出現在成功的那個位置旁邊。 */
function Sparkle({ className }: { className: string }) {
  return (
    <span className={`${styles.sparkle} ${className}`}>
      <span />
    </span>
  );
}

/** 星星線稿（viewBox 0 0 100 100）。 */
const STAR_PATH = "M50 6 L62 37 L95 38 L69 58 L79 91 L50 72 L21 91 L31 58 L5 38 L38 37 Z";

/**
 * 繪本塗塗鴉：封面著色本兩頁的圖都已經上好色，所以在左頁空白處先出現一顆星星線稿，
 * 黃色蠟筆在線稿裡來回塗滿（塗的筆畫被線稿裁住，不會出界）。
 */
function ColoringDemo() {
  const clipId = `demo-star-${useId().replace(/:/g, "")}`;
  return (
    <span className={styles.coloring}>
      <svg className={styles.starArt} viewBox="0 0 100 100">
        <defs>
          <clipPath id={clipId}>
            <path d={STAR_PATH} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <path
            className={styles.scribble}
            d="M10 40 L40 14 L22 56 L62 18 L30 86 L80 36 L50 90 L92 44"
            pathLength={1}
          />
        </g>
        <path className={styles.starLine} d={STAR_PATH} />
      </svg>
      <span className={styles.crayon} />
      <Sparkle className={styles.coloringSparkle} />
    </span>
  );
}

/** 車車消消樂：上排中間那格換成小紅，三台小紅排一排就一起消掉，空格再淡回封面（像補上新棋子）。 */
function MatchDemo() {
  return (
    <span className={styles.match}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={styles.tile} data-col={i} />
      ))}
      {/* 中排中間那格也蓋住：計程車換下去時坐在空格上，不疊在封面原本的棋子上 */}
      <span className={styles.tile} data-col={1} data-row="below" />
      <span className={styles.piece} data-col={0} data-role="match">
        <PieceArt piece={0} />
      </span>
      <span className={styles.piece} data-col={2} data-role="match">
        <PieceArt piece={0} />
      </span>
      <span className={styles.piece} data-col={1} data-role="out">
        <PieceArt piece={1} />
      </span>
      <span className={styles.piece} data-col={1} data-role="in">
        <PieceArt piece={0} />
      </span>
      <Sparkle className={styles.matchSparkle} />
    </span>
  );
}

/** 多多壽司屋：一塊玉子從上面「啪」地落到握壽司的飯上，壓一下、彈回來。 */
function CookingDemo() {
  return (
    <span className={styles.cooking}>
      <span className={styles.plate} />
      {/* eslint-disable-next-line @next/next/no-img-element -- 現有黏土食材小圖，動畫要直接控制 img */}
      <img className={styles.rice} src={dinoSushiSrc("food/nigiri.webp")} alt="" draggable={false} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={styles.topping} src={dinoSushiSrc("food/tamago.webp")} alt="" draggable={false} />
      <Sparkle className={styles.cookingSparkle} />
    </span>
  );
}

const DEMOS: Partial<Record<GameMeta["gameType"], () => React.JSX.Element>> = {
  coloring: ColoringDemo,
  match: MatchDemo,
  cooking: CookingDemo,
};
