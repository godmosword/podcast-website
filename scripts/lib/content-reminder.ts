/**
 * 內容待辦彙整提醒：新集上架滿 7 天還沒校對或沒歸主題，全站維持一張 Issue。
 * 每集的待生圖 Issue 關掉就不會再提醒，沒歸主題的集數又一直篩不到，所以由看門狗每輪對帳。
 * 合進 main 後自動更新、全部做完自動關；手動關掉等於延後 7 天，自動關掉不算。
 */
import { getStories } from "../../data/content";
import { episodeFinderTheme } from "../../data/episode-themes";
import { assigneeArgs, callGh, ensureLabel, mentionPreamble, type SyncAlertDeps } from "../sync-alert";
import { isSubtitleProofreadMarked } from "./subtitle-proofread";

const DAY_MS = 86_400_000;
const PENDING_AFTER_MS = 7 * DAY_MS;
const SNOOZE_MS = 7 * DAY_MS;
const BASE_LABEL = "sync-alert";
const LABEL = "content-pending";
/** 查得到近期關閉的單，用這個分辨是看門狗關的（不延後）還是人關的（延後）。 */
export const AUTO_CLOSED_MARK = `<!-- ${LABEL}:auto-closed -->`;
/** 關過的單不多；抓多一點才找得到最後關掉的那張（gh 預設依建立時間排）。 */
const ISSUE_LIST_LIMIT = "20";

type Missing = "theme" | "proofread";
const MISSING_LABEL: Record<Missing, string> = { theme: "歸主題", proofread: "字幕校對" };

type ReminderStory = { slug: string; ep: number; title: string; date: string };
export type PendingEpisode = ReminderStory & { missing: readonly Missing[] };
type OpenIssue = { number: number; body: string };

export type ReminderAction =
  | { type: "none" }
  | { type: "create" }
  | { type: "edit"; number: number }
  | { type: "close"; issues: readonly OpenIssue[] };

export function pendingEpisodes(
  stories: readonly ReminderStory[],
  opts: { isMarked: (slug: string) => boolean; hasTheme: (slug: string) => boolean; now: number },
): PendingEpisode[] {
  return stories
    .filter((story) => opts.now - Date.parse(story.date) >= PENDING_AFTER_MS)
    .map((story) => {
      const missing: Missing[] = [
        ...(opts.hasTheme(story.slug) ? [] : (["theme"] as const)),
        ...(opts.isMarked(story.slug) ? [] : (["proofread"] as const)),
      ];
      return { ...story, missing };
    })
    .filter((episode) => episode.missing.length > 0)
    .sort((a, b) => a.ep - b.ep);
}

/** 藏在內文的簽名：清單沒變就不改 Issue，不會每小時動一次。 */
export function reminderSignature(pending: readonly PendingEpisode[]): string {
  const list = pending.map((e) => `${e.slug}=${e.missing.join("+")}`).join(";");
  return `<!-- ${LABEL}:${list} -->`;
}

function docLink(repo: string | undefined): string {
  const path = "docs/EPISODE-WORKFLOW.md";
  return repo ? `[EPISODE-WORKFLOW.md](https://github.com/${repo}/blob/main/${path})` : `\`${path}\``;
}

export function buildReminderBody(pending: readonly PendingEpisode[], repo?: string): string {
  const firstMissing = (kind: Missing) => pending.find((e) => e.missing.includes(kind));
  const proofread = firstMissing("proofread");
  return [
    reminderSignature(pending),
    "這幾集上架滿 7 天，還有事沒做完：",
    "",
    ...pending.map(
      (e) => `- **${e.slug} ${e.title}**（${e.date}）：${e.missing.map((m) => MISSING_LABEL[m]).join("、")}`,
    ),
    "",
    "怎麼做：",
    "",
    ...(firstMissing("theme")
      ? ["- 歸主題（先做）：在 `data/episode-themes.ts` 加一列，不然找故事選主題時不會出現。沒歸主題就 `--mark`，測試會紅。"]
      : []),
    ...(proofread
      ? [`- 字幕校對：站上字幕還是草稿，校完跑 \`npm run proofread:subtitles -- ${proofread.slug} --mark\`。`]
      : []),
    "",
    `細節見 ${docLink(repo)}。`,
    "",
    "合進 main 後一小時內這裡會自動更新，全部做完自動關閉。現在不處理可以先關掉，7 天後會再提醒。",
  ].join("\n");
}

export function decideReminder(input: {
  pending: readonly PendingEpisode[];
  opens: readonly OpenIssue[];
  lastClosedAt: string | null;
  now: number;
}): ReminderAction {
  const { pending, opens, lastClosedAt, now } = input;
  if (pending.length === 0) return opens.length > 0 ? { type: "close", issues: opens } : { type: "none" };
  const open = opens[0];
  if (open) {
    return open.body.includes(reminderSignature(pending)) ? { type: "none" } : { type: "edit", number: open.number };
  }
  const snoozed = lastClosedAt !== null && now - Date.parse(lastClosedAt) < SNOOZE_MS;
  return snoozed ? { type: "none" } : { type: "create" };
}

/** 查不到就丟錯：不能把「查失敗」當成「沒有單」，不然每小時多開一張。 */
function listReminderIssues<T>(state: "open" | "closed", fields: string, deps: SyncAlertDeps): T[] {
  const out = callGh(
    ["issue", "list", "--state", state, "--label", BASE_LABEL, "--label", LABEL, "--json", fields, "--limit", ISSUE_LIST_LIMIT],
    deps,
  );
  return JSON.parse(out || "[]") as T[];
}

/** 最後關掉的那張是人關的才算延後；看門狗自己關的不算。 */
function lastManualCloseAt(closed: readonly { closedAt: string; body: string }[]): string | null {
  const latest = [...closed].sort((a, b) => Date.parse(b.closedAt) - Date.parse(a.closedAt))[0];
  return latest && !latest.body.includes(AUTO_CLOSED_MARK) ? latest.closedAt : null;
}

function applyReminder(
  action: ReminderAction,
  pending: readonly PendingEpisode[],
  deps: SyncAlertDeps,
): void {
  const env = deps.env ?? process.env;
  const title = `[內容] 還有 ${pending.length} 集沒歸主題或沒校對`;
  const body = buildReminderBody(pending, env.GITHUB_REPOSITORY?.trim());
  if (action.type === "close") {
    for (const issue of action.issues) {
      callGh(["issue", "edit", String(issue.number), "--body", `${issue.body}\n${AUTO_CLOSED_MARK}`], deps);
      callGh(["issue", "close", String(issue.number), "--comment", "✅ 滿 7 天的集數都歸主題、校對了，自動關閉。"], deps);
    }
  } else if (action.type === "edit") {
    callGh(["issue", "edit", String(action.number), "--title", title, "--body", body], deps);
  } else if (action.type === "create") {
    ensureLabel(BASE_LABEL, "5319e7", "同步告警", deps);
    ensureLabel(LABEL, "0e8a16", "新集沒歸主題或沒校對", deps);
    callGh(
      [
        "issue",
        "create",
        "--title",
        title,
        "--body",
        `${mentionPreamble(env)}${body}`,
        "--label",
        BASE_LABEL,
        "--label",
        LABEL,
        ...assigneeArgs(env),
      ],
      deps,
    );
  }
}

export type ContentReminderDeps = SyncAlertDeps & {
  now?: number;
  stories?: readonly ReminderStory[];
  isMarked?: (slug: string) => boolean;
  hasTheme?: (slug: string) => boolean;
};

/** 任何失敗都只記 warning：提醒壞了不能連累看門狗本身。 */
export function runContentReminder(deps: ContentReminderDeps = {}): void {
  const now = deps.now ?? Date.now();
  const logLine = deps.log ?? console.log;
  try {
    const pending = pendingEpisodes(deps.stories ?? getStories(), {
      isMarked: deps.isMarked ?? isSubtitleProofreadMarked,
      hasTheme: deps.hasTheme ?? ((slug) => episodeFinderTheme(slug) !== ""),
      now,
    });
    const opens = listReminderIssues<OpenIssue>("open", "number,body", deps);
    const closed =
      pending.length > 0 && opens.length === 0
        ? listReminderIssues<{ closedAt: string; body: string }>("closed", "closedAt,body", deps)
        : [];
    const action = decideReminder({ pending, opens, lastClosedAt: lastManualCloseAt(closed), now });
    applyReminder(action, pending, deps);
    logLine(`內容提醒：${pending.length} 集待處理，動作 ${action.type}`);
  } catch (err) {
    (deps.warn ?? console.warn)(`內容提醒略過：${(err as Error).message}`);
  }
}
