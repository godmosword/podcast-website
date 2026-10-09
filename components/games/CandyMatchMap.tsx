"use client";

import { useState, type CSSProperties } from "react";
import type { CandyMatchLevel } from "@/lib/games/candy-match/levels";
import { CANDY_MODES, type CandyMode } from "@/lib/games/candy-match/stages";
import { IconLock, IconPlay, IconStar } from "@/components/games/ClayIcons";
import { CandyGoalIcon } from "@/components/games/CandyMatchTaskBar";
import { IconFootprints, IconLeaf } from "@/components/games/CandyMatchIcons";
import type { CandyGoal } from "@/lib/games/candy-match/tasks";
import styles from "./CandyMatchMap.module.css";

/**
 * 選關：玩法切換、下一站大卡（圖＋任務圖案＋大圓開始鈕）、1–10 站路線。
 * 孩子看圖認站、看圖案和數字認任務；整句任務只給讀屏。
 * 點已解鎖的站換成預覽；點鎖住的站說明要先完成哪一站。
 */

export type CandyStationPreview = {
  goals: readonly CandyGoal[];
  summary: string;
  moves: number;
  replay: boolean;
};

type CandyMatchMapProps = {
  levels: readonly CandyMatchLevel[];
  /** 每關累積獎章星數（0–3） */
  stars: readonly number[];
  /** 已通關數＝下一個可玩的 index */
  maxCleared: number;
  mode: CandyMode;
  onModeChange: (mode: CandyMode) => void;
  previewFor: (index: number) => CandyStationPreview;
  onStart: (index: number) => void;
};

/** 畫面上只留兩個字＋圖示；完整說明（不限步數…）放在 aria-label。 */
const MODE_SHORT: Record<CandyMode, string> = { easy: "輕鬆", challenge: "挑戰" };

/** 手機直向蛇形：左、中、右、中、左…每站一列（3 欄）。 */
const NARROW_LANE_CYCLE = [1, 2, 3, 2] as const;
const NARROW_COLS = 3;
/** 寬螢幕蛇行：每排 5 站，單數排左到右、雙數排右到左。 */
const WIDE_COLS = 5;

function narrowCell(index: number): { col: number; row: number } {
  return { col: NARROW_LANE_CYCLE[index % NARROW_LANE_CYCLE.length]!, row: index + 1 };
}

function wideCell(index: number): { col: number; row: number } {
  const row = Math.floor(index / WIDE_COLS) + 1;
  const step = index % WIDE_COLS;
  return { col: row % 2 === 1 ? step + 1 : WIDE_COLS - step, row };
}

/**
 * 路線用每格中心點連起來：一格在 viewBox 裡佔 2 單位，中心是 2n-1。
 * SVG 拉伸填滿 grid，線寬用 non-scaling-stroke 保持一致；站數變了線也跟著算。
 */
function pathFor(count: number, cell: (i: number) => { col: number; row: number }, cols: number) {
  const cells = Array.from({ length: count }, (_, i) => cell(i));
  const rows = cells.reduce((max, c) => Math.max(max, c.row), 1);
  return {
    viewBox: `0 0 ${cols * 2} ${rows * 2}`,
    points: cells.map(({ col, row }) => `${col * 2 - 1},${row * 2 - 1}`).join(" "),
  };
}

function ModeToggle({ mode, onChange }: { mode: CandyMode; onChange: (mode: CandyMode) => void }) {
  return (
    <div className={styles.modeToggle} role="radiogroup" aria-label="玩法">
      {CANDY_MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          role="radio"
          aria-checked={mode === m.id}
          className={styles.modeOption}
          data-mode={m.id}
          aria-label={`${m.label}。${m.hint}`}
          onClick={() => onChange(m.id)}
        >
          {m.id === "easy" ? <IconLeaf size={20} /> : <IconFootprints size={20} />}
          {MODE_SHORT[m.id]}
        </button>
      ))}
    </div>
  );
}

function goalsLabel(preview: CandyStationPreview, mode: CandyMode): string {
  const moves = mode === "challenge" && preview.moves > 0 ? `，${preview.moves} 步內` : "";
  const replay = preview.replay ? "，換新任務" : "";
  return `${preview.summary}${moves}${replay}`;
}

export function CandyMatchMap({
  levels,
  stars,
  maxCleared,
  mode,
  onModeChange,
  previewFor,
  onStart,
}: CandyMatchMapProps) {
  const nextIndex = Math.min(maxCleared, Math.max(0, levels.length - 1));
  const finished = maxCleared >= levels.length;
  const [picked, setPicked] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const heroIndex = picked != null && picked <= maxCleared ? picked : nextIndex;
  const hero = levels[heroIndex];

  if (!hero) return null;
  const preview = previewFor(heroIndex);
  const isNext = !finished && heroIndex === maxCleared;
  const startLabel = heroIndex < maxCleared ? "再玩一次" : "開始";
  const nextLevel = levels[nextIndex];
  const showMoves = mode === "challenge" && preview.moves > 0;
  const narrowPath = pathFor(levels.length, narrowCell, NARROW_COLS);
  const widePath = pathFor(levels.length, wideCell, WIDE_COLS);

  return (
    <div className={styles.map} data-testid="candy-match-map">
      <ModeToggle mode={mode} onChange={onModeChange} />

      <div className={styles.hero}>
        <span className={styles.heroArt} aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element -- 固定 256px 黏土小圖 */}
          <img
            src={`/games/v2/candy-match/places/${hero.placeIcon}.webp`}
            alt=""
            width={256}
            height={256}
          />
        </span>
        <div className={styles.heroInfo}>
          <p className={styles.heroStation}>第 {heroIndex + 1} 站</p>
          <p className={styles.heroPlace}>{hero.place}</p>
          <p className={styles.heroGoals} aria-label={goalsLabel(preview, mode)}>
            {preview.goals.map((goal, i) => (
              <span key={i} className={styles.heroGoal}>
                <CandyGoalIcon goal={goal} size={30} />
                <b aria-hidden>×{goal.count}</b>
              </span>
            ))}
            {showMoves ? (
              <span className={styles.heroMoves} aria-hidden>
                <IconFootprints size={16} />
                {preview.moves}
              </span>
            ) : null}
          </p>
        </div>
        <button
          type="button"
          className={styles.heroStart}
          data-next={isNext ? "true" : undefined}
          aria-label={`${startLabel}：第 ${heroIndex + 1} 站 ${hero.place}`}
          title={startLabel}
          onClick={() => onStart(heroIndex)}
        >
          <IconPlay size={32} />
        </button>
      </div>

      <p className={styles.notice} role="status">
        {notice}
      </p>

      <div className={styles.path}>
        <svg className={styles.pathNarrow} viewBox={narrowPath.viewBox} preserveAspectRatio="none" aria-hidden>
          <polyline points={narrowPath.points} vectorEffect="non-scaling-stroke" />
        </svg>
        <svg className={styles.pathWide} viewBox={widePath.viewBox} preserveAspectRatio="none" aria-hidden>
          <polyline points={widePath.points} vectorEffect="non-scaling-stroke" />
        </svg>
        {levels.map((lv) => {
          const i = lv.index;
          const locked = i > maxCleared;
          const next = !locked && i === maxCleared;
          const got = Math.max(0, Math.min(3, stars[i] ?? 0));
          const narrow = narrowCell(i);
          const wide = wideCell(i);
          const cell = {
            "--nc": String(narrow.col),
            "--nr": String(narrow.row),
            "--wc": String(wide.col),
            "--wr": String(wide.row),
          } as CSSProperties;
          return (
            <button
              key={lv.index}
              type="button"
              className={`${styles.node}${next ? ` ${styles.next}` : ""}`}
              style={cell}
              aria-disabled={locked || undefined}
              aria-current={i === heroIndex ? "true" : undefined}
              data-locked={locked ? "true" : undefined}
              aria-label={`第 ${i + 1} 站 ${lv.place}${locked ? "（未解鎖）" : `，${got} 顆星`}`}
              title={lv.place}
              onClick={() => {
                if (locked) {
                  // 大卡直接換成該先完成的那一站：畫面本身就是答案
                  setPicked(nextIndex);
                  setNotice(`先完成第 ${nextIndex + 1} 站「${nextLevel?.place ?? ""}」，就能往前走喔！`);
                  return;
                }
                setNotice("");
                setPicked(i);
              }}
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
                <span className={styles.nodeNumber} aria-hidden>
                  {i + 1}
                </span>
                {locked ? (
                  <span className={styles.lock} aria-hidden>
                    <IconLock size={22} />
                  </span>
                ) : (
                  <span className={styles.stars} aria-hidden>
                    {[0, 1, 2].map((s) => (
                      <IconStar key={s} size={13} color={s < got ? "#ffd34d" : "#e2d9e8"} />
                    ))}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
