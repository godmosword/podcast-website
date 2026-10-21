#!/usr/bin/env npx tsx
/**
 * 補一集尚未完成的字幕。給 transcribe-backfill workflow 用，不在同步 job 裡跑。
 *
 * 失敗寫進 data/apple-sync-state.json。同一 guid 滿 SUBTITLE_ATTEMPT_LIMIT 次才開 issue。
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { alertAfterConsecutiveFailures } from "./sync-alert";
import { runTranscribeBackfill, type BackfillState } from "./lib/transcribe-backfill";
import { autoProofreadFixSlug } from "./lib/subtitle-proofread";
import { relocalizeSidecars, transcribeToSidecar } from "./lib/transcribe-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STATE_PATH = path.join(ROOT, "data/apple-sync-state.json");

function readState(): BackfillState {
  const raw = readFileSync(STATE_PATH, "utf8");
  return JSON.parse(raw) as BackfillState;
}

function writeState(state: BackfillState): void {
  writeFileSync(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function main(): void {
  const result = runTranscribeBackfill({
    readState,
    writeState,
    audioExists: (slug) => existsSync(path.join(ROOT, "public/stories", slug, "audio.mp3")),
    transcribe: (slug) => {
      const audioPath = path.join(ROOT, "public/stories", slug, "audio.mp3");
      const { count, file } = transcribeToSidecar(slug, audioPath);
      console.log(`字幕：${slug} ${count} 句 → ${path.relative(ROOT, file)}`);
      try {
        relocalizeSidecars([slug]);
        const proof = autoProofreadFixSlug(slug);
        console.log(`字幕校稿：${slug} 自動修正 ${proof.fixCount} 處`);
      } catch (err) {
        console.warn(`字幕後處理略過 ${slug}：${(err as Error).message}`);
      }
    },
    alertLimit: ({ guid, stage }) => {
      alertAfterConsecutiveFailures({
        immediate: true,
        category: "whisper",
        step: "Transcribe backfill",
        kind: "sync-job-failure",
        title: `[sync][whisper] ${stage.slug} 字幕轉錄失敗`,
        body: [
          `\`${stage.slug}\`（guid \`${guid}\`）字幕已失敗 ${stage.subtitleAttempts} 次，不再自動重試。`,
          "",
          "集數可以先上線。字幕補上後，把 `apple-sync-state.json` 裡這筆的 `subtitles` 改回 `pending`、`subtitleAttempts` 歸零，workflow 才會再跑。",
          "",
          stage.lastSubtitleError ? `最後一次錯誤：${stage.lastSubtitleError}` : "",
        ].join("\n"),
        excerpt: `##[error]${stage.slug} whisper 失敗 ${stage.subtitleAttempts} 次：${stage.lastSubtitleError ?? ""}`,
      });
    },
  });

  console.log(`transcribe-backfill：${result.status}${result.slug ? ` ${result.slug}` : ""}`);
  if (result.status === "idle") return;

  const messagePath = process.env.SYNC_COMMIT_MSG_PATH;
  if (messagePath) {
    const line =
      result.status === "ok"
        ? `sync: 補上 ${result.slug} 字幕`
        : `sync: ${result.slug} 字幕轉錄失敗（${result.attempts} 次）`;
    writeFileSync(messagePath, `${line}\n`, "utf8");
  }
}

const entry = process.argv[1]?.replace(/\\/g, "/") ?? "";
if (entry.endsWith("transcribe-backfill.ts")) {
  try {
    main();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
