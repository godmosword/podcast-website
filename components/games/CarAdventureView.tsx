"use client";

import { useCallback, useEffect, useState } from "react";
import { useCoarsePointer } from "@/hooks/useCoarsePointer";
import { CarAdventureMenu } from "@/components/games/car-adventure/CarAdventureMenu";
import {
  BarTouchButton,
  touchControlStyles,
} from "@/lib/gamekit/react/TouchControls";
import type { GameAudioBus, OverlayProps } from "@/lib/gamekit/adapter";
import {
  loadPlayerProfile,
  recordAdventureStars,
  savePlayerProfile,
} from "@/lib/gamekit/progress/save";
import { GAMES } from "@/data/games";
import type { CarAdventureInstance } from "@/lib/gamekit/games/car-adventure/adapter";
import styles from "./car-adventure/CarAdventureGame.module.css";

const CAR_ADVENTURE_META = GAMES.find((g) => g.slug === "car-adventure");
const COVER = CAR_ADVENTURE_META?.art.cover ?? "/games/v2/car-adventure/cover.webp";

export type CarAdventureController = {
  onStars(levelIndex: number, stars: number): void;
  onLevelAdvanced?(next: number): void;
};

export type CarAdventureViewProps = OverlayProps & {
  audio?: GameAudioBus;
  instance: CarAdventureInstance;
};

/**
 * 車車大冒險 DOM overlay：選單、觸控列、說明。
 * Canvas 由 GameHost 提供（須在選單之前），避免入口 CTA 被裁切。
 */
export function CarAdventureView({
  status,
  score,
  kidsMode,
  onStart,
  onResume,
  onOpenTutorial,
  syncHost,
  instance,
}: CarAdventureViewProps) {
  const isCoarse = useCoarsePointer();
  const [levelIndex, setLevelIndex] = useState(() => instance.getLevelIndex());
  const [adventureStars, setAdventureStars] = useState<Record<number, number>>(
    {},
  );

  useEffect(() => {
    setAdventureStars(loadPlayerProfile().adventureStars ?? {});
  }, []);

  const saveAdventureStars = useCallback(
    (idx: number, stars: number) => {
      const profile = loadPlayerProfile();
      const next = recordAdventureStars(profile, idx, stars);
      if (next !== profile) savePlayerProfile(next);
      setAdventureStars(next.adventureStars ?? {});
    },
    [],
  );

  useEffect(() => {
    instance.registerController({
      onStars: saveAdventureStars,
      onLevelAdvanced: (next) => {
        setLevelIndex(next);
        syncHost();
      },
    });
    return () => {
      instance.registerController({
        onStars: () => undefined,
      });
    };
  }, [instance, saveAdventureStars, syncHost]);

  useEffect(() => {
    setLevelIndex(instance.getLevelIndex());
  }, [instance, status]);

  /** E2E smoke hook：只把測試局送到終點，仍走正常結算／存檔路徑。 */
  useEffect(() => {
    if (status !== "playing" || typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("debugFinish") !== "1") {
      return;
    }
    instance.debugFinish();
  }, [status, instance]);

  const hold =
    (action: "move-left" | "move-right" | "action" | "dash", v: boolean) =>
    () => {
      instance.setAction(action, v);
    };

  return (
    <div className={styles.shell}>
      {/* Canvas 由 GameHost 畫在 overlay 之前；選單必須在 canvas 外。 */}
      <CarAdventureMenu
        status={status}
        levelIndex={levelIndex}
        score={score > 0 ? score : null}
        adventureStars={adventureStars}
        kidsMode={kidsMode}
        coverSrc={COVER}
        onSelectLevel={(i) => {
          instance.selectLevel(i);
          setLevelIndex(i);
        }}
        onStart={() => {
          instance.selectLevel(levelIndex);
          onStart();
        }}
        onResume={onResume}
        onOpenTutorial={onOpenTutorial}
      />

      <div className={touchControlStyles.touchBar}>
        <div className={touchControlStyles.touchCluster}>
          <BarTouchButton
            label="左"
            coarse={isCoarse}
            onDown={hold("move-left", true)}
            onUp={hold("move-left", false)}
          >
            ⬅️
          </BarTouchButton>
          <BarTouchButton
            label="右"
            coarse={isCoarse}
            onDown={hold("move-right", true)}
            onUp={hold("move-right", false)}
          >
            ➡️
          </BarTouchButton>
        </div>
        <BarTouchButton
          label="跳"
          big
          coarse={isCoarse}
          onDown={hold("action", true)}
          onUp={hold("action", false)}
        >
          ⬆️ 跳
        </BarTouchButton>
        <BarTouchButton
          label="衝刺"
          coarse={isCoarse}
          onDown={hold("dash", true)}
          onUp={hold("dash", false)}
        >
          💨
        </BarTouchButton>
      </div>

      <p className={styles.help}>
        {isCoarse
          ? "按住按鈕移動 · 點跳躍"
          : "← → / A D 移動 · ↑ / W / 空白鍵 跳 · X / Shift / 手把 X 衝刺 · P 暫停"}
      </p>
    </div>
  );
}
