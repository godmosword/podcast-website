import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ROOT, subtitleCoverageProblem, transcribeWithRetries } from "./transcribe-core";

const cues = (...times: number[]) => times.map((t) => ({ t, text: `第${t}秒` }));

describe("subtitleCoverageProblem", () => {
  it("整集都有字幕才算數", () => {
    expect(subtitleCoverageProblem(cues(0, 10, 20, 30, 40), 50)).toBeNull();
    expect(subtitleCoverageProblem(cues(20, 25, 30, 35), 45)).toBeNull();
  });

  it("抓得到 ep-36 壞掉那份（第一句 330 秒）、0 句、中間一大段空白、後面沒了", () => {
    expect(subtitleCoverageProblem(cues(330, 400, 462), 473)).toContain("第一句");
    expect(subtitleCoverageProblem([], 473)).toContain("沒有字幕");
    expect(subtitleCoverageProblem(cues(0, 5, 200, 205), 210)).toContain("空白");
    expect(subtitleCoverageProblem(cues(0, 5, 10), 300)).toContain("結尾");
  });

  it("第一句剛好 30 秒也算缺開頭（Whisper 一個視窗被吃掉）；句數太少也不算數", () => {
    expect(subtitleCoverageProblem(cues(30, 35, 40), 50)).toContain("第一句");
    // 每 50 秒一句：沒有大空白、也有到結尾，但只有誤聽的零星幾句。
    const sparse = Array.from({ length: 10 }, (_, i) => ({ t: i * 50, text: `第${i}句` }));
    expect(subtitleCoverageProblem(sparse, 500)).toContain("句數");
  });

  it("現有字幕掃一次都過得了門檻", () => {
    const lengths = JSON.parse(readFileSync(join(ROOT, "data/audio-lengths.json"), "utf8")) as Record<string, number>;
    const dir = join(ROOT, "data/subtitles");
    const flagged: string[] = [];
    for (const file of readdirSync(dir).filter((name) => name.endsWith(".json"))) {
      const slug = file.replace(/\.json$/, "");
      const bytes = lengths[slug];
      if (!bytes || !existsSync(join(dir, file))) continue;
      const segments = JSON.parse(readFileSync(join(dir, file), "utf8")) as { t: number; text: string }[];
      // 音檔都是 128 kbps：位元組 ÷ 16000 ≈ 秒。
      if (subtitleCoverageProblem(segments, bytes / 16000)) flagged.push(slug);
    }
    expect(flagged).toEqual([]);
  });
});

describe("transcribeWithRetries", () => {
  const full = cues(0, 10, 20, 30, 40, 50);

  it("第一次就夠：不重跑", () => {
    const calls: string[][] = [];
    const out = transcribeWithRetries({
      durationSec: 60,
      run: (args) => {
        calls.push(args);
        return full;
      },
      runSlice: () => {
        throw new Error("不該切段");
      },
    });
    expect(out).toEqual(full);
    expect(calls).toEqual([[]]);
  });

  it("第一次不足 → 關掉上下文延續（-mc 0）重跑", () => {
    const calls: string[][] = [];
    const out = transcribeWithRetries({
      durationSec: 60,
      run: (args) => {
        calls.push(args);
        return args.length === 0 ? cues(50) : full;
      },
      runSlice: () => [],
    });
    expect(calls).toEqual([[], ["-mc", "0"]]);
    expect(out).toEqual(full);
  });

  it("開頭還空：前面切成每段 9 秒補轉，時間加回原位、接在前面", () => {
    const slices: number[] = [];
    const out = transcribeWithRetries({
      durationSec: 80,
      run: (args) => (args.length === 0 ? cues(70) : cues(27, 35, 45, 55, 65, 75)),
      runSlice: (start) => {
        slices.push(start);
        return [{ t: 1, text: `開頭${start}` }];
      },
    });
    expect(slices).toEqual([0, 9, 18]);
    expect(out.slice(0, 3)).toEqual([
      { t: 1, text: "開頭0" },
      { t: 10, text: "開頭9" },
      { t: 19, text: "開頭18" },
    ]);
    expect(out.slice(3).map((cue) => cue.t)).toEqual([27, 35, 45, 55, 65, 75]);
  });

  it("補轉不會把開頭之後的句子疊進來；同一句重複只留一句", () => {
    const out = transcribeWithRetries({
      durationSec: 50,
      run: (args) => (args.length === 0 ? cues(45) : [{ t: 20, text: "接著" }, ...cues(30, 40, 45)]),
      runSlice: (start) =>
        start === 18
          ? [
              { t: 0, text: "前一句" },
              { t: 8, text: "接著" },
            ]
          : [],
    });
    expect(out.map((cue) => cue.text)).toEqual(["前一句", "接著", "第30秒", "第40秒", "第45秒"]);
  });

  it("開頭缺太多不切段：ep-36 那種第一句 330 秒要切 37 段，會超過 job 時限、連失敗都記不到", () => {
    const slices: number[] = [];
    expect(() =>
      transcribeWithRetries({
        durationSec: 473,
        run: () => cues(330, 340, 350, 400, 450, 462),
        runSlice: (start) => {
          slices.push(start);
          return [];
        },
      }),
    ).toThrow(/字幕不完整/);
    expect(slices).toEqual([]);
  });

  it("確認過音檔真的這樣（長音樂）：allowGaps 寫出最好的一份，不丟錯", () => {
    const out = transcribeWithRetries({
      durationSec: 300,
      allowGaps: true,
      run: () => cues(0, 10, 20, 30),
      runSlice: () => [],
    });
    expect(out.map((cue) => cue.t)).toEqual([0, 10, 20, 30]);
  });

  it("全部試過還是不足：丟錯，不寫出殘缺字幕", () => {
    expect(() =>
      transcribeWithRetries({ durationSec: 473, run: () => [], runSlice: () => [] }),
    ).toThrow(/字幕不完整/);
    expect(() =>
      transcribeWithRetries({ durationSec: 473, run: () => cues(330, 400, 462), runSlice: () => [] }),
    ).toThrow(/字幕不完整/);
  });
});
