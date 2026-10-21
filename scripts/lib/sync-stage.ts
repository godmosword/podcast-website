/**
 * 每一集的同步進度，以 RSS guid 為鍵。
 * metadata／封面／blur 沒好就不上架；字幕可以先 pending，集數照樣上線。
 */

export const SUBTITLE_ATTEMPT_LIMIT = 3;

export type StageStatus = "ok" | "pending" | "failed";

export type EpisodeStage = {
  slug: string;
  metadata: StageStatus;
  cover: StageStatus;
  blur: StageStatus;
  subtitles: StageStatus;
  subtitleAttempts: number;
  lastSubtitleError?: string;
};

export type EpisodeStageInput = {
  slug: string;
  guid: string;
  cover: boolean;
  blur: boolean;
  subtitles: boolean;
};

export function emptyEpisodeStage(slug: string): EpisodeStage {
  return {
    slug,
    metadata: "pending",
    cover: "pending",
    blur: "pending",
    subtitles: "pending",
    subtitleAttempts: 0,
  };
}

/** 封面沒好就不要寫進目錄。blur 可以先 pending，驗證前會再產生。 */
export function canPublishEpisode(stage: Pick<EpisodeStage, "metadata" | "cover">): boolean {
  return stage.metadata === "ok" && stage.cover === "ok";
}

export function reconcileEpisodeStages(input: {
  episodes?: Record<string, EpisodeStage>;
  present: readonly EpisodeStageInput[];
}): Record<string, EpisodeStage> {
  const next: Record<string, EpisodeStage> = {};
  const previous = input.episodes ?? {};
  const rows = [...input.present].sort((a, b) => a.guid.localeCompare(b.guid));
  for (const row of rows) {
    const prev = previous[row.guid] ?? emptyEpisodeStage(row.slug);
    const subtitles: StageStatus = row.subtitles
      ? "ok"
      : prev.subtitles === "failed"
        ? "failed"
        : "pending";
    const stage: EpisodeStage = {
      slug: row.slug,
      metadata: "ok",
      cover: row.cover ? "ok" : "failed",
      blur: row.blur ? "ok" : prev.blur === "failed" ? "failed" : "pending",
      subtitles,
      subtitleAttempts: prev.subtitleAttempts ?? 0,
    };
    if (!row.subtitles && prev.lastSubtitleError) {
      stage.lastSubtitleError = prev.lastSubtitleError;
    }
    next[row.guid] = stage;
  }
  return next;
}

export function pickSubtitleBackfill(
  episodes: Record<string, EpisodeStage>,
  limit = SUBTITLE_ATTEMPT_LIMIT,
): { guid: string; stage: EpisodeStage } | null {
  const candidates = Object.entries(episodes)
    .filter(([, stage]) => stage.metadata === "ok" && stage.cover === "ok")
    .filter(([, stage]) => stage.subtitles === "pending" || stage.subtitles === "failed")
    .filter(([, stage]) => stage.subtitleAttempts < limit)
    .sort((a, b) => a[1].slug.localeCompare(b[1].slug, "en"));
  const first = candidates[0];
  if (!first) return null;
  return { guid: first[0], stage: first[1] };
}

export function recordSubtitleResult(
  stage: EpisodeStage,
  outcome: "ok" | "failed",
  error?: string,
): EpisodeStage {
  if (outcome === "ok") {
    const next: EpisodeStage = { ...stage, subtitles: "ok" };
    delete next.lastSubtitleError;
    return next;
  }
  return {
    ...stage,
    subtitles: "failed",
    subtitleAttempts: stage.subtitleAttempts + 1,
    lastSubtitleError: error?.trim() || "轉錄失敗",
  };
}

export function subtitleAttemptsExhausted(
  stage: EpisodeStage,
  limit = SUBTITLE_ATTEMPT_LIMIT,
): boolean {
  return stage.subtitles !== "ok" && stage.subtitleAttempts >= limit;
}
