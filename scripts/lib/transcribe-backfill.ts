/**
 * 一次只轉錄一集缺字幕的集數。失敗記在 guid 上，滿 N 次才開一張 whisper issue。
 * 同步本體不跑 whisper，所以新集可以先上線。
 */
import {
  pickSubtitleBackfill,
  recordSubtitleResult,
  SUBTITLE_ATTEMPT_LIMIT,
  subtitleAttemptsExhausted,
  type EpisodeStage,
} from "./sync-stage";

export type BackfillState = {
  seenGuids: string[];
  lastRun: string | null;
  guidBySlug?: Record<string, string>;
  episodes?: Record<string, EpisodeStage>;
};

export type BackfillResult = {
  status: "idle" | "ok" | "retry" | "limit";
  guid?: string;
  slug?: string;
  attempts?: number;
};

export type BackfillDeps = {
  readState: () => BackfillState;
  writeState: (state: BackfillState) => void;
  audioExists: (slug: string) => boolean;
  transcribe: (slug: string) => void;
  alertLimit?: (input: { guid: string; stage: EpisodeStage }) => void;
  attemptLimit?: number;
};

export function runTranscribeBackfill(deps: BackfillDeps): BackfillResult {
  const limit = deps.attemptLimit ?? SUBTITLE_ATTEMPT_LIMIT;
  const state = deps.readState();
  const episodes = { ...(state.episodes ?? {}) };
  const picked = pickSubtitleBackfill(episodes, limit);
  if (!picked) return { status: "idle" };

  const fail = (message: string): BackfillResult => {
    const next = recordSubtitleResult(picked.stage, "failed", message);
    episodes[picked.guid] = next;
    deps.writeState({ ...state, episodes });
    if (subtitleAttemptsExhausted(next, limit)) {
      deps.alertLimit?.({ guid: picked.guid, stage: next });
      return {
        status: "limit",
        guid: picked.guid,
        slug: next.slug,
        attempts: next.subtitleAttempts,
      };
    }
    return {
      status: "retry",
      guid: picked.guid,
      slug: next.slug,
      attempts: next.subtitleAttempts,
    };
  };

  if (!deps.audioExists(picked.stage.slug)) {
    return fail("缺音檔，無法轉錄");
  }

  try {
    deps.transcribe(picked.stage.slug);
  } catch (err) {
    return fail((err as Error).message);
  }

  episodes[picked.guid] = recordSubtitleResult(picked.stage, "ok");
  deps.writeState({ ...state, episodes });
  return { status: "ok", guid: picked.guid, slug: picked.stage.slug, attempts: picked.stage.subtitleAttempts };
}
