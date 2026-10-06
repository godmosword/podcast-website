"use client";

/**
 * 《繽紛樂園》任務冒險地圖：玩法切換＋站點大卡（關號、站名、迷你起始盤、任務、開始）＋兩列小路。
 * 結構對齊消消樂地圖；站點圖示用 CSS 迷你盤（石頭＋缺口），不出圖。
 */
import { useState, type CSSProperties } from "react";
import { IconLock, IconStar } from "@/components/games/ClayIcons";
import type { BlockGoal } from "@/lib/games/block-drop/goals";
import type { BlockMode, BlockStation } from "@/lib/games/block-drop/stages";
import { BlockGoalIcon } from "./BlockDropTaskBar";
import { MACARON_THEME, primaryBtn, secondaryBtn } from "./blockDropTheme";

export type BlockStationPreview = {
  stones: readonly string[];
  goals: readonly BlockGoal[];
  summary: string;
  pieceCap: number;
  replay: boolean;
};

const MODES: readonly { id: BlockMode; label: string; hint: string }[] = [
  { id: "easy", label: "輕鬆冒險", hint: "慢慢落、不會輸" },
  { id: "challenge", label: "挑戰冒險", hint: "有塊數限制" },
];

/** 迷你起始盤：8 欄石頭排（由下往上），缺口留白。 */
export function MiniStoneBoard({ stones, cell = 6 }: { stones: readonly string[]; cell?: number }) {
  const rows = [...stones].reverse();
  return (
    <span
      aria-hidden
      style={{
        display: "inline-grid",
        gridTemplateColumns: `repeat(8, ${cell}px)`,
        gap: 1,
        padding: 3,
        borderRadius: 6,
        background: "linear-gradient(180deg,#3d3f82,#2a2c5e)",
      }}
    >
      {rows.flatMap((row, r) =>
        [...row].map((ch, c) => (
          <span
            key={`${r}-${c}`}
            style={{
              width: cell,
              height: cell,
              borderRadius: 1,
              background: ch === "X" ? "#cdbfb2" : "rgba(255,232,137,.45)",
            }}
          />
        )),
      )}
    </span>
  );
}

type Props = {
  stations: readonly BlockStation[];
  stars: readonly number[];
  maxCleared: number;
  mode: BlockMode;
  font: string;
  onModeChange: (mode: BlockMode) => void;
  previewFor: (index: number) => BlockStationPreview;
  onStart: (index: number) => void;
  onFree: () => void;
  onHome: () => void;
};

export function BlockDropMap({
  stations,
  stars,
  maxCleared,
  mode,
  font,
  onModeChange,
  previewFor,
  onStart,
  onFree,
  onHome,
}: Props) {
  const nextIndex = Math.min(maxCleared, stations.length - 1);
  const finished = maxCleared >= stations.length;
  const [picked, setPicked] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const heroIndex = picked != null && picked <= maxCleared ? picked : nextIndex;
  const hero = stations[heroIndex]!;
  const preview = previewFor(heroIndex);
  const isNext = !finished && heroIndex === maxCleared;
  const startLabel = heroIndex < maxCleared ? "再玩一次" : "開始";
  const card: CSSProperties = {
    display: "grid",
    gap: 10,
    padding: 12,
    borderRadius: 22,
    background: "rgba(255,255,255,.86)",
    boxShadow: "0 8px 18px rgba(150,110,130,.14)",
    color: MACARON_THEME.ink,
  };
  return (
    <div data-testid="block-drop-map" style={{ display: "grid", gap: 10, fontFamily: font }}>
      <h2 style={{ margin: 0, textAlign: "center", fontSize: 18, fontWeight: 900, color: MACARON_THEME.ink }}>
        冒險地圖
      </h2>
      <div role="radiogroup" aria-label="玩法" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, padding: 4, borderRadius: 18, background: "rgba(255,255,255,.7)" }}>
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={mode === m.id}
            onClick={() => onModeChange(m.id)}
            style={{
              display: "grid",
              gap: 1,
              minHeight: 48,
              padding: "6px 8px",
              border: "none",
              borderRadius: 14,
              cursor: "pointer",
              fontFamily: font,
              color: MACARON_THEME.ink,
              background: mode === m.id ? "#fff" : "transparent",
              boxShadow: mode === m.id ? "inset 0 0 0 2px #ffbd6f" : "none",
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 900 }}>{m.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: MACARON_THEME.inkSoft }}>{m.hint}</span>
          </button>
        ))}
      </div>

      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <MiniStoneBoard stones={preview.stones} cell={7} />
          <div style={{ display: "grid", gap: 3, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>
              第 {heroIndex + 1} 站・{hero.name}
            </p>
            <p style={{ margin: 0, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, fontSize: 15, fontWeight: 800 }}>
              {preview.goals.map((goal, i) => (
                <BlockGoalIcon key={i} goal={goal} />
              ))}
              {preview.summary}
            </p>
            {mode === "challenge" || preview.replay ? (
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: MACARON_THEME.inkSoft }}>
                {[mode === "challenge" ? `${preview.pieceCap} 塊內完成` : null, preview.replay ? "重玩換新盤" : null]
                  .filter(Boolean)
                  .join("・")}
              </p>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          data-next={isNext ? "true" : undefined}
          aria-label={`${startLabel}：第 ${heroIndex + 1} 站 ${hero.name}`}
          onClick={() => onStart(heroIndex)}
          style={{ ...primaryBtn(font), width: "100%" }}
        >
          {startLabel}
        </button>
      </div>

      <p role="status" style={{ margin: 0, minHeight: notice ? 20 : 0, textAlign: "center", fontSize: 14, fontWeight: 800, color: MACARON_THEME.accentPink }}>
        {notice}
      </p>

      <div style={{ display: "grid", gap: 10 }}>
        {[stations.slice(0, 5), stations.slice(5, 10)].map((row, r) => (
          <div key={r} style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(5, 52px)", justifyContent: "space-between" }}>
            <span aria-hidden style={{ position: "absolute", left: 26, right: 26, top: 22, height: 6, borderRadius: 999, background: "#e8a44a" }} />
            {row.map((st) => {
              const i = st.index;
              const locked = i > maxCleared;
              const got = Math.max(0, Math.min(3, stars[i] ?? 0));
              return (
                <button
                  key={i}
                  type="button"
                  aria-disabled={locked || undefined}
                  aria-current={i === heroIndex ? "true" : undefined}
                  data-locked={locked ? "true" : undefined}
                  aria-label={`第 ${i + 1} 站 ${st.name}${locked ? "（未解鎖）" : `，${got} 顆星`}`}
                  onClick={() => {
                    if (locked) {
                      setPicked(nextIndex);
                      setNotice(`先完成第 ${nextIndex + 1} 站「${stations[nextIndex]?.name ?? ""}」，就能往前走喔！`);
                      return;
                    }
                    setNotice("");
                    setPicked(i);
                  }}
                  style={{
                    position: "relative",
                    zIndex: 1,
                    display: "grid",
                    justifyItems: "center",
                    gap: 2,
                    minHeight: 52,
                    padding: 0,
                    border: "none",
                    background: "transparent",
                    cursor: locked ? "default" : "pointer",
                    fontFamily: font,
                  }}
                >
                  <span
                    style={{
                      position: "relative",
                      display: "grid",
                      placeItems: "center",
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      background: "#fff7ea",
                      border: "2px solid #fff",
                      boxShadow:
                        i === heroIndex
                          ? "0 0 0 3px #ffbd6f, 0 4px 10px rgba(150,110,130,.22)"
                          : "0 4px 10px rgba(150,110,130,.22)",
                      color: MACARON_THEME.ink,
                      fontSize: 17,
                      fontWeight: 900,
                    }}
                  >
                    {i + 1}
                    {locked ? (
                      <span aria-hidden style={{ position: "absolute", right: -4, bottom: -4, lineHeight: 0, background: "#fff", borderRadius: "50%", padding: 1 }}>
                        <IconLock size={20} />
                      </span>
                    ) : null}
                  </span>
                  <span aria-hidden style={{ display: "inline-flex", gap: 1, minHeight: 12, lineHeight: 0 }}>
                    {locked
                      ? null
                      : [0, 1, 2].map((s) => <IconStar key={s} size={12} color={s < got ? "#ffd34d" : "#d9d0e0"} />)}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <p style={{ margin: 0, textAlign: "center", fontSize: 12, fontWeight: 700, color: MACARON_THEME.inkSoft }}>
        星星是每站累積的獎章，兩種玩法都算。
      </p>
      <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
        <button type="button" onClick={onFree} style={secondaryBtn(font)}>
          自由堆疊
        </button>
        <button type="button" onClick={onHome} style={secondaryBtn(font)}>
          回標題
        </button>
      </div>
    </div>
  );
}
