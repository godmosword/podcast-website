import { describe, expect, it } from "vitest";
import { SUBTITLE_ATTEMPT_LIMIT, type EpisodeStage } from "./sync-stage";
import { runTranscribeBackfill, type BackfillState } from "./transcribe-backfill";

function stateWith(stage: EpisodeStage, guid = "guid-1"): BackfillState {
  return { seenGuids: [guid], lastRun: null, episodes: { [guid]: stage } };
}

describe("runTranscribeBackfill", () => {
  it("沒有待補字幕就不動 state", () => {
    let written = 0;
    const result = runTranscribeBackfill({
      readState: () =>
        stateWith({
          slug: "ep-1",
          metadata: "ok",
          cover: "ok",
          blur: "ok",
          subtitles: "ok",
          subtitleAttempts: 0,
        }),
      writeState: () => {
        written += 1;
      },
      audioExists: () => true,
      transcribe: () => {
        throw new Error("不該轉錄");
      },
    });
    expect(result.status).toBe("idle");
    expect(written).toBe(0);
  });

  it("同一 guid 失敗累計，滿 N 次才告警，下次不再挑這集", () => {
    let saved = stateWith({
      slug: "ep-4",
      metadata: "ok",
      cover: "ok",
      blur: "pending",
      subtitles: "pending",
      subtitleAttempts: SUBTITLE_ATTEMPT_LIMIT - 1,
    });
    const alerts: string[] = [];
    const result = runTranscribeBackfill({
      readState: () => saved,
      writeState: (next) => {
        saved = next;
      },
      audioExists: () => true,
      transcribe: () => {
        throw new Error("whisper timeout");
      },
      alertLimit: ({ guid }) => alerts.push(guid),
    });
    expect(result.status).toBe("limit");
    expect(alerts).toEqual(["guid-1"]);
    expect(saved.episodes?.["guid-1"]?.subtitleAttempts).toBe(SUBTITLE_ATTEMPT_LIMIT);

    const again = runTranscribeBackfill({
      readState: () => saved,
      writeState: () => {
        throw new Error("不該再寫");
      },
      audioExists: () => true,
      transcribe: () => {
        throw new Error("不該再跑");
      },
    });
    expect(again.status).toBe("idle");
  });

  it("成功後這集標成 ok，處理是冪等的", () => {
    let saved = stateWith({
      slug: "ep-8",
      metadata: "ok",
      cover: "ok",
      blur: "ok",
      subtitles: "pending",
      subtitleAttempts: 1,
    });
    const result = runTranscribeBackfill({
      readState: () => saved,
      writeState: (next) => {
        saved = next;
      },
      audioExists: () => true,
      transcribe: () => undefined,
    });
    expect(result).toMatchObject({ status: "ok", slug: "ep-8" });
    expect(saved.episodes?.["guid-1"]?.subtitles).toBe("ok");
  });
});
