"use client";

/**
 * 《繽紛樂園》任務冒險地圖（對齊消消樂）：玩法切換、下一站大卡（迷你起始盤＋任務圖案＋大圓開始鈕）、
 * 1–10 站蛇形小路、底部「自由堆疊」。孩子看圖認站、看圖案和數字認任務；整句任務只給讀屏。
 * 站點沒有插圖：大卡用 CSS 迷你盤（石頭＋缺口），小路上用站號。
 * 點已解鎖的站換成預覽；點鎖住的站說明要先完成哪一站。
 */
import { useState, type CSSProperties } from "react";
import { IconLeaf } from "@/components/games/CandyMatchIcons";
import { IconLock, IconPlay, IconStar } from "@/components/games/ClayIcons";
import { BlockGoalIcon, IconFreeStack, IconPieces, MiniStoneBoard } from "@/components/games/BlockDropIcons";
import { blockGoalCount, type BlockGoal } from "@/lib/games/block-drop/goals";
import type { BlockMode, BlockStation } from "@/lib/games/block-drop/stages";
import styles from "./BlockDropMap.module.css";

export type BlockStationPreview = {
  stones: readonly string[];
  goals: readonly BlockGoal[];
  summary: string;
  pieceCap: number;
  replay: boolean;
};

const MODES: readonly { id: BlockMode; label: string; short: string; hint: string }[] = [
  { id: "easy", label: "輕鬆冒險", short: "輕鬆", hint: "慢慢落、不會輸" },
  { id: "challenge", label: "挑戰冒險", short: "挑戰", hint: "有塊數限制" },
];

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

/** 路線用每格中心點連起來：一格在 viewBox 裡佔 2 單位，中心是 2n-1。 */
function pathFor(count: number, cell: (i: number) => { col: number; row: number }, cols: number) {
  const cells = Array.from({ length: count }, (_, i) => cell(i));
  const rows = cells.reduce((max, c) => Math.max(max, c.row), 1);
  return {
    viewBox: `0 0 ${cols * 2} ${rows * 2}`,
    points: cells.map(({ col, row }) => `${col * 2 - 1},${row * 2 - 1}`).join(" "),
  };
}

function goalsLabel(preview: BlockStationPreview, mode: BlockMode): string {
  const cap = mode === "challenge" && preview.pieceCap > 0 ? `，${preview.pieceCap} 塊內完成` : "";
  const replay = preview.replay ? "，重玩換新盤" : "";
  return `${preview.summary}${cap}${replay}`;
}

type Props = {
  stations: readonly BlockStation[];
  stars: readonly number[];
  maxCleared: number;
  mode: BlockMode;
  onModeChange: (mode: BlockMode) => void;
  previewFor: (index: number) => BlockStationPreview;
  onStart: (index: number) => void;
  onFree: () => void;
};

export function BlockDropMap({ stations, stars, maxCleared, mode, onModeChange, previewFor, onStart, onFree }: Props) {
  const nextIndex = Math.min(maxCleared, stations.length - 1);
  const finished = maxCleared >= stations.length;
  const [picked, setPicked] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const heroIndex = picked != null && picked <= maxCleared ? picked : nextIndex;
  const hero = stations[heroIndex]!;
  const preview = previewFor(heroIndex);
  const isNext = !finished && heroIndex === maxCleared;
  const startLabel = heroIndex < maxCleared ? "再玩一次" : "開始";
  const showCap = mode === "challenge" && preview.pieceCap > 0;
  const narrowPath = pathFor(stations.length, narrowCell, NARROW_COLS);
  const widePath = pathFor(stations.length, wideCell, WIDE_COLS);

  return (
    <div className={styles.map} data-testid="block-drop-map">
      <h2 className={styles.visuallyHidden}>冒險地圖</h2>
      {/* 玩法：葉子＝輕鬆、方塊＝挑戰；只留兩個字，說明在 aria-label */}
      <div className={styles.modeToggle} role="radiogroup" aria-label="玩法">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={mode === m.id}
            className={styles.modeOption}
            data-mode={m.id}
            aria-label={`${m.label}。${m.hint}`}
            onClick={() => onModeChange(m.id)}
          >
            {m.id === "easy" ? <IconLeaf size={20} /> : <IconPieces size={20} />}
            {m.short}
          </button>
        ))}
      </div>

      <div className={styles.hero}>
        <span className={styles.heroArt}>
          <MiniStoneBoard stones={preview.stones} />
        </span>
        <div className={styles.heroInfo}>
          <p className={styles.heroStation}>第 {heroIndex + 1} 站</p>
          <p className={styles.heroPlace}>{hero.name}</p>
          <p className={styles.heroGoals} role="img" aria-label={goalsLabel(preview, mode)}>
            {preview.goals.map((goal, i) => (
              <span key={i} className={styles.heroGoal}>
                <BlockGoalIcon goal={goal} cell={10} />
                <b aria-hidden>×{blockGoalCount(goal, preview.stones.length)}</b>
              </span>
            ))}
            {showCap ? (
              <span className={styles.heroCap} aria-hidden>
                <IconPieces size={16} />
                {preview.pieceCap}
              </span>
            ) : null}
          </p>
        </div>
        <button
          type="button"
          className={styles.heroStart}
          data-next={isNext ? "true" : undefined}
          aria-label={`${startLabel}：第 ${heroIndex + 1} 站 ${hero.name}`}
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
        {stations.map((st) => {
          const i = st.index;
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
              key={i}
              type="button"
              className={`${styles.node}${next ? ` ${styles.next}` : ""}`}
              style={cell}
              aria-disabled={locked || undefined}
              aria-current={i === heroIndex ? "true" : undefined}
              data-locked={locked ? "true" : undefined}
              aria-label={`第 ${i + 1} 站 ${st.name}${locked ? "（未解鎖）" : `，${got} 顆星`}`}
              title={st.name}
              onClick={() => {
                if (locked) {
                  // 大卡直接換成該先完成的那一站：畫面本身就是答案
                  setPicked(nextIndex);
                  setNotice(`先完成第 ${nextIndex + 1} 站「${stations[nextIndex]?.name ?? ""}」，就能往前走喔！`);
                  return;
                }
                setNotice("");
                setPicked(i);
              }}
            >
              <span className={styles.badge} aria-hidden>
                {i + 1}
                {locked ? (
                  <span className={styles.lock}>
                    <IconLock size={20} />
                  </span>
                ) : (
                  <span className={styles.stars}>
                    {[0, 1, 2].map((s) => (
                      <IconStar key={s} size={12} color={s < got ? "#ffd34d" : "#e2d9e8"} />
                    ))}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <button type="button" className={styles.free} onClick={onFree}>
        <IconFreeStack size={18} />
        自由堆疊
      </button>
    </div>
  );
}
