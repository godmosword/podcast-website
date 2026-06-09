const KEY = "cheche:kart-save";

export type Medal = "gold" | "silver" | "bronze" | null;

export type TrackRecord = {
  bestLapMs: number;
  bestTotalMs: number;
  medal: Medal;
};

export type KartSave = {
  version: 1;
  unlockedKarts: string[];
  selectedKart: string;
  selectedTrack: string;
  soundOn: boolean;
  musicOn: boolean;
  kidsMode: boolean;
  records: Record<string, TrackRecord>;
};

const DEFAULT: KartSave = {
  version: 1,
  unlockedKarts: ["xiaohuang", "monster-truck", "xiaohong"],
  selectedKart: "xiaohuang",
  selectedTrack: "practice-oval",
  soundOn: true,
  musicOn: true,
  kidsMode: true,
  records: {},
};

export function loadSave(): KartSave {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT, records: {} };
    return { ...DEFAULT, ...(JSON.parse(raw) as KartSave) };
  } catch {
    return { ...DEFAULT, records: {} };
  }
}

export function writeSave(save: KartSave): void {
  localStorage.setItem(KEY, JSON.stringify(save));
}

export function medalForLapMs(lapMs: number, gold: number, silver: number): Medal {
  if (lapMs <= 0) return null;
  if (lapMs <= gold) return "gold";
  if (lapMs <= silver) return "silver";
  if (lapMs <= silver * 1.15) return "bronze";
  return null;
}

export function recordRaceResult(
  save: KartSave,
  trackId: string,
  totalMs: number,
  bestLapMs: number,
  thresholds: { gold: number; silver: number },
): KartSave {
  const prev = save.records[trackId] ?? {
    bestLapMs: 0,
    bestTotalMs: 0,
    medal: null,
  };
  const medal = medalForLapMs(bestLapMs, thresholds.gold, thresholds.silver);
  const next: TrackRecord = {
    bestLapMs: prev.bestLapMs > 0 ? Math.min(prev.bestLapMs, bestLapMs) : bestLapMs,
    bestTotalMs: prev.bestTotalMs > 0 ? Math.min(prev.bestTotalMs, totalMs) : totalMs,
    medal: rankMedal(prev.medal, medal),
  };
  return {
    ...save,
    records: { ...save.records, [trackId]: next },
  };
}

function rankMedal(a: Medal, b: Medal): Medal {
  const rank = { gold: 3, silver: 2, bronze: 1, null: 0 };
  return rank[a ?? "null"] >= rank[b ?? "null"] ? a : b;
}
