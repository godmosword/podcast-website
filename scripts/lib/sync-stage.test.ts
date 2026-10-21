import { describe, expect, it } from "vitest";
import {
  canPublishEpisode,
  pickSubtitleBackfill,
  reconcileEpisodeStages,
  recordSubtitleResult,
  SUBTITLE_ATTEMPT_LIMIT,
  subtitleAttemptsExhausted,
  type EpisodeStage,
} from "./sync-stage";

function stage(partial: Partial<EpisodeStage> & { slug: string }): EpisodeStage {
  return {
    metadata: "ok",
    cover: "ok",
    blur: "ok",
    subtitles: "pending",
    subtitleAttempts: 0,
    ...partial,
  };
}

describe("reconcileEpisodeStages", () => {
  it("以 guid 補上階段，字幕缺檔保持 pending，不重算已失敗次數", () => {
    const episodes = reconcileEpisodeStages({
      episodes: {
        "guid-b": stage({
          slug: "ep-2",
          subtitles: "failed",
          subtitleAttempts: 2,
          lastSubtitleError: "whisper",
        }),
      },
      present: [
        { slug: "ep-2", guid: "guid-b", cover: true, blur: true, subtitles: false },
        { slug: "ep-1", guid: "guid-a", cover: true, blur: false, subtitles: false },
      ],
    });

    expect(Object.keys(episodes)).toEqual(["guid-a", "guid-b"]);
    expect(episodes["guid-a"]).toMatchObject({
      slug: "ep-1",
      metadata: "ok",
      cover: "ok",
      blur: "pending",
      subtitles: "pending",
      subtitleAttempts: 0,
    });
    expect(episodes["guid-b"]).toMatchObject({
      subtitles: "failed",
      subtitleAttempts: 2,
      lastSubtitleError: "whisper",
    });
  });

  it("封面缺檔不能上架；字幕 pending 可以", () => {
    expect(canPublishEpisode(stage({ slug: "ep-1", cover: "failed" }))).toBe(false);
    expect(canPublishEpisode(stage({ slug: "ep-1", subtitles: "pending" }))).toBe(true);
  });
});

describe("pickSubtitleBackfill", () => {
  it("每次只挑一集，略過已達重試上限的 guid", () => {
    const picked = pickSubtitleBackfill({
      "guid-z": stage({ slug: "ep-9", subtitles: "pending" }),
      "guid-a": stage({
        slug: "ep-3",
        subtitles: "failed",
        subtitleAttempts: SUBTITLE_ATTEMPT_LIMIT,
      }),
      "guid-b": stage({ slug: "ep-4", subtitles: "ok" }),
    });
    expect(picked?.stage.slug).toBe("ep-9");
  });

  it("失敗次數加一，成功後清掉錯誤", () => {
    const failed = recordSubtitleResult(stage({ slug: "ep-1" }), "failed", "timeout");
    expect(failed.subtitleAttempts).toBe(1);
    expect(failed.subtitles).toBe("failed");
    expect(subtitleAttemptsExhausted(failed)).toBe(false);
    const ok = recordSubtitleResult(failed, "ok");
    expect(ok.subtitles).toBe("ok");
    expect(ok.lastSubtitleError).toBeUndefined();
  });
});
