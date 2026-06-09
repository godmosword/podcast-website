"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useGameKitProgress } from "@/hooks/useGameKitProgress";
import { preloadAllGameAssets } from "@/lib/gamekit/preload";
import {
  GARAGE_VEHICLES,
  GAME_STICKERS,
  gameMedalStars,
  nextGarageUnlock,
  type GameKitGameId,
} from "@/lib/gamekit";
import { GAMES } from "@/lib/games/catalog";
import styles from "./GamesWorldMap.module.css";

const GAME_ICONS: Record<string, string> = {
  "car-adventure": "🏁",
  "block-drop": "🧩",
  kart: "🏎️",
  "pirate-kart": "🏴‍☠️",
};

function isGameKitGameId(gameId: string): gameId is GameKitGameId {
  return gameId === "car-adventure" || gameId === "block-drop";
}

function formatBest(gameId: GameKitGameId, best: number): string {
  if (best <= 0) return "—";
  if (gameId === "car-adventure") return `第 ${best} 關`;
  return String(best);
}

export function GamesWorldMap() {
  const { profile } = useGameKitProgress();

  useEffect(() => {
    void preloadAllGameAssets();
  }, []);

  if (!profile) {
    return <p className={styles.loading}>載入進度中…</p>;
  }

  const medalTotal = GAMES.reduce(
    (sum, game) =>
      sum + (isGameKitGameId(game.id) ? gameMedalStars(profile, game.id) : 0),
    0,
  );
  const unlockedCount = GARAGE_VEHICLES.filter((v) =>
    profile.unlockedVehicles.includes(v.id),
  ).length;
  const nextUnlock = nextGarageUnlock(profile.stars);

  return (
    <div className={styles.wrap}>
      <header className={styles.hero}>
        <p className={styles.kicker}>車車世界地圖</p>
        <h2 className={styles.title}>我的冒險進度</h2>
        <p className={styles.sub}>
          收集星星解鎖車庫、完成關卡拿三星、貼紙簿記錄你的遊樂園足跡。
        </p>
        <div className={styles.stats}>
          <span>⭐ {profile.stars} 顆星</span>
          <span>🏅 {medalTotal} 枚三星</span>
          <span>
            🚗 {unlockedCount}/{GARAGE_VEHICLES.length} 輛車
          </span>
          <span>📒 {profile.stickers.length} 張貼紙</span>
        </div>
        {nextUnlock && (
          <p className={styles.nextUnlock}>
            再 {nextUnlock.starsRequired - profile.stars} 顆星解鎖 {nextUnlock.emoji}{" "}
            {nextUnlock.name}
          </p>
        )}
      </header>

      <section className={styles.map} aria-label="遊戲地圖">
        {GAMES.map((game, i) => {
          const meta = isGameKitGameId(game.id)
            ? {
                medals: gameMedalStars(profile, game.id),
                bestLabel: formatBest(game.id, profile.bests[game.id] ?? 0),
              }
            : null;
          return (
            <Link
              key={game.id}
              href={game.href}
              className={styles.island}
              style={{ "--i": i } as React.CSSProperties}
            >
              <span className={styles.islandIcon} aria-hidden>
                {GAME_ICONS[game.id] ?? game.emoji}
              </span>
              <span className={styles.islandTitle}>{game.title}</span>
              <span className={styles.islandMeta}>
                {meta
                  ? `🏅 ${meta.medals} · 最佳 ${meta.bestLabel}`
                  : game.id === "pirate-kart"
                    ? "海盜競速 · 新上架"
                    : "3D 漂移競速 · 新上架"}
              </span>
            </Link>
          );
        })}
      </section>

      <section className={styles.garage} aria-label="車庫">
        <h3 className={styles.sectionTitle}>🚗 我的車庫</h3>
        <ul className={styles.carRow}>
          {GARAGE_VEHICLES.map((car) => {
            const unlocked = profile.unlockedVehicles.includes(car.id);
            return (
              <li
                key={car.id}
                className={unlocked ? styles.carOn : styles.carOff}
                title={
                  unlocked
                    ? car.name
                    : `需要 ${car.starsRequired} 顆星（目前 ${profile.stars}）`
                }
              >
                <span className={styles.carEmoji} aria-hidden>
                  {unlocked ? car.emoji : "🔒"}
                </span>
                <span className={styles.carLabel}>{car.name}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={styles.stickers} aria-label="貼紙簿">
        <h3 className={styles.sectionTitle}>📒 貼紙簿</h3>
        <ul className={styles.stickerGrid}>
          {GAME_STICKERS.map((def) => {
            const earned = profile.stickers.includes(def.id);
            return (
              <li
                key={def.id}
                className={earned ? styles.stickerOn : styles.stickerOff}
                title={earned ? def.label : def.hint}
              >
                <span aria-hidden>{earned ? def.emoji : "❓"}</span>
                <span className={styles.stickerLabel}>{def.label}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
