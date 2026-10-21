"use client";

import type { ComponentType } from "react";
import Icon from "@/components/ui/Icon";
import type { PlayMapScenarioId } from "@/lib/play-map-scenarios";
import type { PlayMapScenarioGridProps } from "./PlayMapContract";
import { EnergyScene } from "./scene-art/EnergyScene";
import { ExhibitScene } from "./scene-art/ExhibitScene";
import { FreeScene } from "./scene-art/FreeScene";
import { RainyScene } from "./scene-art/RainyScene";
import styles from "./PlayMapScenarioGrid.module.css";

const SCENE_ART: Record<PlayMapScenarioId, ComponentType> = {
  rainy: RainyScene,
  energy: EnergyScene,
  exhibit: ExhibitScene,
  free: FreeScene,
};

/**
 * 「今天想怎麼玩？」四張情境卡。單選；再點同一張＝取消。
 * 插畫是程式畫的向量黏土（不是 AI 生圖），aria-hidden；卡名與數量就是按鈕的名字。
 */
export function PlayMapScenarioGrid({
  compact = false,
  scenarios,
  scopeLabel,
  onSelect,
}: PlayMapScenarioGridProps) {
  return (
    <div
      className={styles.grid}
      role="group"
      aria-label="今天想怎麼玩"
      data-compact={compact ? "true" : "false"}
    >
      {scenarios.map((item) => {
        const Art = SCENE_ART[item.id];
        return (
          <button
            key={item.id}
            type="button"
            className={styles.card}
            aria-pressed={item.pressed}
            aria-label={`${item.label}，${scopeLabel} ${item.count} 處`}
            data-quick-filter={item.quickFilter}
            data-scenario={item.id}
            onClick={() => onSelect(item.id)}
          >
            {compact ? null : (
              <span className={styles.art}>
                <Art />
              </span>
            )}
            <span className={styles.body}>
              <span className={styles.label}>{item.label}</span>
              <span className={styles.count}>
                {scopeLabel} {item.count} 處
              </span>
            </span>
            {item.pressed ? (
              <span className={styles.check} aria-hidden>
                <Icon name="check" size={16} />
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
