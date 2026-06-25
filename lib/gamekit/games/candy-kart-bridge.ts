import type { GameSessionResult } from "../progress/session";
import {
  candyKartTrackById,
  CANDY_KART_CLEAR_POSITION,
} from "@/lib/games/candy-kart/tracks";

/** Kart 榜單分數：時間越短分數越高。 */
export function kartScoreFromTotalMs(totalMs: number): number {
  if (!Number.isFinite(totalMs) || totalMs <= 0) return 0;
  return Math.floor(1_000_000 / totalMs);
}

// ── 繽紛卡丁車（Candy Kart / Godot）協定 ──

export const CANDY_KART_MESSAGE_SOURCE = "cheche-candy-kart" as const;

/** Godot 端載入完成（父頁據此關閉 loading 畫面）。 */
export type CandyKartReadyMessage = {
  source: typeof CANDY_KART_MESSAGE_SOURCE;
  type: "ready";
};

export type CandyKartFinishMessage = {
  source: typeof CANDY_KART_MESSAGE_SOURCE;
  type: "race-finish";
  trackId: string;
  /** 終點名次（1 = 冠軍） */
  playerPos: number;
  totalMs: number;
  bestLapMs: number;
  starsCollected: number;
  starsTotal: number;
};

export function isCandyKartReadyMessage(
  data: unknown,
): data is CandyKartReadyMessage {
  if (!data || typeof data !== "object") return false;
  const m = data as Partial<CandyKartReadyMessage>;
  return m.source === CANDY_KART_MESSAGE_SOURCE && m.type === "ready";
}

export function isCandyKartFinishMessage(
  data: unknown,
): data is CandyKartFinishMessage {
  if (!data || typeof data !== "object") return false;
  const m = data as Partial<CandyKartFinishMessage>;
  return (
    m.source === CANDY_KART_MESSAGE_SOURCE &&
    m.type === "race-finish" &&
    typeof m.trackId === "string" &&
    typeof m.playerPos === "number" &&
    typeof m.totalMs === "number" &&
    typeof m.bestLapMs === "number" &&
    typeof m.starsCollected === "number" &&
    typeof m.starsTotal === "number" &&
    Number.isFinite(m.playerPos) &&
    m.playerPos >= 1 &&
    Number.isFinite(m.totalMs) &&
    m.totalMs > 0 &&
    Number.isFinite(m.bestLapMs) &&
    Number.isFinite(m.starsCollected) &&
    m.starsCollected >= 0 &&
    Number.isFinite(m.starsTotal) &&
    m.starsTotal >= 0
  );
}

/**
 * finish 訊息 → gamekit 結果（三星：cleared=前3名、flawless=時間達標、
 * collectedAll=收齊彩虹星星）。未知 trackId 仍回報分數，但不發獎牌。
 */
export function candyKartSessionFromFinish(
  msg: CandyKartFinishMessage,
): GameSessionResult {
  const track = candyKartTrackById(msg.trackId);
  const base: GameSessionResult = {
    gameId: "candy-kart",
    score: kartScoreFromTotalMs(msg.totalMs),
  };
  if (!track) return base;
  return {
    ...base,
    levelIndex: track.levelIndex,
    cleared: msg.playerPos <= CANDY_KART_CLEAR_POSITION,
    flawless: msg.totalMs <= track.parTimeMs,
    collectedAll:
      msg.starsTotal > 0 && msg.starsCollected >= msg.starsTotal,
  };
}
