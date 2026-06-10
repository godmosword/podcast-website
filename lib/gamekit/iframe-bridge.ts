export const KART_MESSAGE_SOURCE = "cheche-kart" as const;

export type KartRaceFinishMessage = {
  source: typeof KART_MESSAGE_SOURCE;
  type: "race-finish";
  playerPos: number;
  totalMs: number;
  bestLapMs: number;
  trackId: string;
};

export function isKartRaceFinishMessage(data: unknown): data is KartRaceFinishMessage {
  if (!data || typeof data !== "object") return false;
  const m = data as Partial<KartRaceFinishMessage>;
  return (
    m.source === KART_MESSAGE_SOURCE &&
    m.type === "race-finish" &&
    typeof m.playerPos === "number" &&
    typeof m.totalMs === "number" &&
    typeof m.bestLapMs === "number" &&
    typeof m.trackId === "string" &&
    Number.isFinite(m.playerPos) &&
    Number.isFinite(m.totalMs) &&
    Number.isFinite(m.bestLapMs)
  );
}

/** Kart 榜單分數：時間越短分數越高。 */
export function kartScoreFromTotalMs(totalMs: number): number {
  if (!Number.isFinite(totalMs) || totalMs <= 0) return 0;
  return Math.floor(1_000_000 / totalMs);
}
