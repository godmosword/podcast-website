import { describe, expect, it } from "vitest";
import {
  AUTO_CLOSED_MARK,
  buildReminderBody,
  decideReminder,
  pendingEpisodes,
  reminderSignature,
  runContentReminder,
  type PendingEpisode,
} from "./content-reminder";

const NOW = Date.parse("2026-11-20T00:00:00Z");
const DAY = 86_400_000;
const story = (ep: number, date: string) => ({ slug: `ep-${ep}`, ep, title: `第 ${ep} 集`, date });

function pending(stories = [story(1, "2026-11-01")], opts: Partial<Parameters<typeof pendingEpisodes>[1]> = {}) {
  return pendingEpisodes(stories, { isMarked: () => false, hasTheme: () => true, now: NOW, ...opts });
}

describe("pendingEpisodes", () => {
  it("滿 7 天才列：差一秒不列、剛好 7 天列", () => {
    expect(pending([story(1, "2026-11-13")])).toHaveLength(1);
    expect(pending([story(1, "2026-11-14")])).toHaveLength(0);
    expect(pending([story(1, "2026-11-13")], { now: Date.parse("2026-11-19T23:59:59Z") })).toHaveLength(0);
  });

  it("分別記缺什麼：只缺校對、只缺主題、都缺；都做完不列", () => {
    expect(pending()[0]!.missing).toEqual(["proofread"]);
    expect(pending(undefined, { isMarked: () => true, hasTheme: () => false })[0]!.missing).toEqual(["theme"]);
    expect(pending(undefined, { hasTheme: () => false })[0]!.missing).toEqual(["theme", "proofread"]);
    expect(pending(undefined, { isMarked: () => true })).toEqual([]);
  });

  it("依集數排序；日期壞掉不列，也不丟錯", () => {
    expect(pending([story(3, "2026-10-01"), story(1, "2026-10-02")]).map((e) => e.ep)).toEqual([1, 3]);
    expect(pending([story(1, "not-a-date")])).toEqual([]);
  });
});

const ONE: PendingEpisode[] = [{ ...story(1, "2026-11-01"), missing: ["proofread"] }];

describe("decideReminder", () => {
  const base = { pending: ONE, opens: [], lastClosedAt: null, now: NOW };

  it("有待處理、沒開著的單：開一張", () => {
    expect(decideReminder(base)).toEqual({ type: "create" });
  });

  it("開著、清單沒變：不動；清單變了：改內文", () => {
    const body = buildReminderBody(ONE);
    expect(decideReminder({ ...base, opens: [{ number: 9, body }] })).toEqual({ type: "none" });
    expect(decideReminder({ ...base, opens: [{ number: 9, body: "舊內容" }] })).toEqual({ type: "edit", number: 9 });
  });

  it("清單空了：開著的全部關（有人重開舊單也一起收），沒開著不動", () => {
    const opens = [{ number: 9, body: "" }, { number: 3, body: "" }];
    expect(decideReminder({ ...base, pending: [], opens })).toEqual({ type: "close", issues: opens });
    expect(decideReminder({ ...base, pending: [] })).toEqual({ type: "none" });
  });

  it("手動關掉算延後：7 天內不重開，滿 7 天重開", () => {
    const closedAt = (days: number) => new Date(NOW - days * DAY).toISOString();
    expect(decideReminder({ ...base, lastClosedAt: closedAt(6) })).toEqual({ type: "none" });
    expect(decideReminder({ ...base, lastClosedAt: closedAt(7) })).toEqual({ type: "create" });
  });
});

describe("buildReminderBody", () => {
  it("帶簽名、列出缺什麼；沒歸主題的說明找故事篩不到", () => {
    const body = buildReminderBody([
      { ...story(1, "2026-11-01"), missing: ["theme", "proofread"] },
      { ...story(2, "2026-11-02"), missing: ["proofread"] },
    ]);
    expect(body).toContain(reminderSignature([{ ...story(1, "x"), missing: ["theme", "proofread"] }, { ...story(2, "x"), missing: ["proofread"] }]));
    expect(body).toContain("第 1 集");
    expect(body).toContain("歸主題、字幕校對");
    expect(body).toContain("找故事");
    expect(body).toContain("EPISODE-WORKFLOW");
  });

  it("都已歸主題時不提找故事", () => {
    expect(buildReminderBody(ONE)).not.toContain("找故事");
  });

  it("歸主題排在校對前面、照抄的指令帶真的集數；兩段清單不會被併成一張", () => {
    const body = buildReminderBody([{ ...story(37, "2026-11-01"), missing: ["theme", "proofread"] }]);
    expect(body.indexOf("歸主題（先做）")).toBeLessThan(body.indexOf("字幕校對："));
    expect(body).toContain("`data/episode-themes.ts`");
    expect(body).toContain("npm run proofread:subtitles -- ep-37 --mark");
    expect(body).toMatch(/\n怎麼做：\n/);
  });
});

describe("runContentReminder", () => {
  function fakeGh(lists: { open?: string; closed?: string; fail?: boolean }) {
    const calls: string[][] = [];
    const gh = (args: string[]) => {
      calls.push(args);
      if (args[0] === "issue" && args[1] === "list") {
        if (lists.fail) throw new Error("gh 壞了");
        return args.includes("closed") ? (lists.closed ?? "[]") : (lists.open ?? "[]");
      }
      return "";
    };
    const verbs = () => calls.filter((c) => c[0] === "issue" && c[1] !== "list").map((c) => c[1]);
    return { gh, calls, verbs };
  }
  const run = (gh: (args: string[]) => string, warn: (m: string) => void = () => {}) =>
    runContentReminder({
      gh,
      warn,
      log: () => {},
      env: { SYNC_ISSUE_MENTIONS: "@someone" },
      now: NOW,
      stories: [story(1, "2026-11-01")],
      isMarked: () => false,
      hasTheme: () => true,
    });

  it("自動關掉不算延後：下一集滿 7 天就開新單", () => {
    const closed = JSON.stringify([{ closedAt: new Date(NOW - DAY).toISOString(), body: `內容\n${AUTO_CLOSED_MARK}` }]);
    const fake = fakeGh({ closed });
    run(fake.gh);
    expect(fake.verbs()).toEqual(["create"]);
  });

  it("手動關掉才延後，而且看的是最後關掉的那張，不是最新建立的那張", () => {
    const closed = JSON.stringify([
      { closedAt: new Date(NOW - 30 * DAY).toISOString(), body: "新建立、很久以前關的" },
      { closedAt: new Date(NOW - DAY).toISOString(), body: "舊單，剛被手動關掉" },
    ]);
    const fake = fakeGh({ closed });
    run(fake.gh);
    expect(fake.verbs()).toEqual([]);
  });

  it("全部做完：自動關閉的單會留下標記，內容保留", () => {
    const fake = fakeGh({ open: JSON.stringify([{ number: 9, body: "舊內容" }]) });
    runContentReminder({ gh: fake.gh, log: () => {}, now: NOW, stories: [], isMarked: () => true, hasTheme: () => true });
    expect(fake.verbs()).toEqual(["edit", "close"]);
    const edit = fake.calls.find((c) => c[1] === "edit")!;
    expect(edit[edit.indexOf("--body") + 1]).toBe(`舊內容\n${AUTO_CLOSED_MARK}`);
  });

  it("開單：帶 mention 與 label", () => {
    const fake = fakeGh({});
    run(fake.gh);
    const create = fake.calls.find((c) => c[0] === "issue" && c[1] === "create")!;
    expect(create.join(" ")).toContain("--label content-pending");
    expect(create[create.indexOf("--body") + 1]).toContain("@someone");
  });

  it("開著且清單沒變：連內文都不改（mention 在內文裡也比得到簽名）", () => {
    const body = `@someone\n\n${buildReminderBody(ONE)}`;
    const fake = fakeGh({ open: JSON.stringify([{ number: 9, body }]) });
    run(fake.gh);
    expect(fake.verbs()).toEqual([]);
  });

  it("清單變了：改內文和標題，不留言", () => {
    const fake = fakeGh({ open: JSON.stringify([{ number: 9, body: "舊" }]) });
    run(fake.gh);
    expect(fake.verbs()).toEqual(["edit"]);
  });

  it("查 Issue 失敗：跳過這輪，不當成沒單而重複開，也不丟錯", () => {
    const fake = fakeGh({ fail: true });
    const warnings: string[] = [];
    run(fake.gh, (m) => warnings.push(m));
    expect(fake.verbs()).toEqual([]);
    expect(warnings).toHaveLength(1);
  });
});
