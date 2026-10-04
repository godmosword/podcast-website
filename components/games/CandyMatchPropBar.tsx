"use client";

import type { ReactNode } from "react";
import { IconBroom, IconBubble, IconBulb, IconRainbow } from "@/components/games/ClayIcons";
import type { CandyProps } from "@/lib/games/candy-match/stages";
import type { CandyPropKind } from "./useCandyMatchPlay";
import styles from "./CandyMatchPlay.module.css";

const PROP_INFO: Record<CandyPropKind, { label: string; range: string; icon: ReactNode }> = {
  bubble: { label: "泡泡", range: "消掉一格", icon: <IconBubble size={22} /> },
  broom: { label: "掃把", range: "掃掉一整排", icon: <IconBroom size={22} /> },
  rainbow: { label: "彩虹", range: "收走同一種", icon: <IconRainbow size={22} /> },
};

const ORDER: readonly CandyPropKind[] = ["bubble", "broom", "rainbow"];

type CandyMatchPropBarProps = {
  /** 本局一開始提供的道具（0 的不顯示） */
  offered: CandyProps;
  left: CandyProps;
  active: CandyPropKind | null;
  hasPreview: boolean;
  disabled: boolean;
  onSelect: (kind: CandyPropKind) => void;
  onCancel: () => void;
  onHint: () => void;
};

/** 「我能用什麼」：道具有名稱與次數；選了先預覽範圍，點亮框裡的格子才用掉，可取消。 */
export function CandyMatchPropBar({
  offered,
  left,
  active,
  hasPreview,
  disabled,
  onSelect,
  onCancel,
  onHint,
}: CandyMatchPropBarProps) {
  const kinds = ORDER.filter((kind) => offered[kind] > 0);
  return (
    <div className={styles.propArea}>
      <div className={styles.propRow} role="group" aria-label="道具">
        {kinds.map((kind) => {
          const info = PROP_INFO[kind];
          const count = left[kind];
          return (
            <button
              key={kind}
              type="button"
              className={styles.propButton}
              disabled={disabled || count <= 0}
              aria-pressed={active === kind}
              aria-label={`${info.label}（${info.range}），還有 ${count} 個`}
              onClick={() => onSelect(kind)}
            >
              <span className={styles.propIcon} aria-hidden>{info.icon}</span>
              <span className={styles.propLabel} aria-hidden>{info.label}</span>
              <span className={styles.propCount} aria-hidden>×{count}</span>
            </button>
          );
        })}
        <button
          type="button"
          className={styles.propButton}
          onClick={onHint}
          disabled={disabled}
          aria-label="提示"
        >
          <span className={styles.propIcon} aria-hidden><IconBulb size={20} /></span>
          <span className={styles.propLabel} aria-hidden>提示</span>
        </button>
      </div>
      {active ? (
        <div className={styles.propGuide} role="status">
          <span>
            {PROP_INFO[active].label}會{PROP_INFO[active].range}。
            {hasPreview ? "點亮框裡的格子就用掉！" : "先點一格看看範圍。"}
          </span>
          <button type="button" className={styles.propCancel} onClick={onCancel} aria-label="取消">
            ✕ 取消
          </button>
        </div>
      ) : null}
    </div>
  );
}
