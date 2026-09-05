import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  canTransitionFeedbackStatus,
  deleteFeedbackMessage,
  FEEDBACK_ADMIN_COLUMNS,
  listFeedbackForModeration,
  parseFeedbackId,
  selectFeedbackAdminRows,
  selectFeedbackStats,
  toAdminDto,
  toFeedbackStats,
  updateFeedbackMessage,
  type FeedbackAdminRow,
} from "./feedback-admin";

type SqlCall = { text: string; values: unknown[] };

const state = vi.hoisted(() => ({
  calls: [] as { text: string; values: unknown[] }[],
  queue: [] as unknown[][],
  fallback: [] as unknown[],
}));

// 假 tagged template 取代 neon，用來檢查實際 SQL 與參數。
vi.mock("@neondatabase/serverless", () => ({
  neon:
    () =>
    (strings: TemplateStringsArray, ...values: unknown[]) => {
      state.calls.push({ text: strings.join(" ? "), values });
      const next = state.queue.shift();
      return Promise.resolve(next ?? state.fallback);
    },
}));

function lastCall(): SqlCall {
  const call = state.calls.at(-1);
  if (!call) throw new Error("沒有 SQL 呼叫");
  return call;
}

const row: FeedbackAdminRow = {
  id: 12,
  nickname: "馬米",
  email: "parent@example.com",
  message: "很喜歡垃圾車那集",
  kind: "general",
  status: "pending",
  needs_review: false,
  created_at: "2026-09-05T02:00:00.000Z",
};

beforeEach(() => {
  state.calls.length = 0;
  state.queue.length = 0;
  state.fallback = [];
  vi.stubEnv("DATABASE_URL", "postgresql://user:pw@localhost/db");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("toAdminDto", () => {
  it("後台 DTO 含 email 與審核欄位，id 轉字串", () => {
    expect(toAdminDto(row)).toEqual({
      id: "12",
      nickname: "馬米",
      email: "parent@example.com",
      message: "很喜歡垃圾車那集",
      kind: "general",
      status: "pending",
      needsReview: false,
      createdAt: "2026-09-05T02:00:00.000Z",
    });
  });

  it("createdAt 一律 ISO、needsReview 一律布林", () => {
    const dto = toAdminDto({
      ...row,
      created_at: new Date("2026-01-02T03:04:05.000Z"),
      needs_review: true,
    });
    expect(dto.createdAt).toBe("2026-01-02T03:04:05.000Z");
    expect(dto.needsReview).toBe(true);
  });
});

describe("toFeedbackStats", () => {
  it("bigint 字串轉數字，缺值補 0", () => {
    expect(
      toFeedbackStats({
        total: "5",
        pending: "2",
        published: "1",
        hidden: "1",
        needs_review: "3",
        story_request: "0",
      }),
    ).toEqual({
      total: 5,
      pending: 2,
      published: 1,
      hidden: 1,
      needsReview: 3,
      storyRequest: 0,
    });
  });

  it("沒有 row 時全部 0", () => {
    expect(toFeedbackStats(undefined)).toEqual({
      total: 0,
      pending: 0,
      published: 0,
      hidden: 0,
      needsReview: 0,
      storyRequest: 0,
    });
  });
});

describe("parseFeedbackId", () => {
  it("只收十進位數字字串", () => {
    expect(parseFeedbackId("12")).toBe("12");
    expect(parseFeedbackId(" 12 ")).toBe("12");
    expect(parseFeedbackId("0")).toBe("0");
  });

  it("擋掉注入與非法值", () => {
    expect(parseFeedbackId("1; DROP TABLE feedback_messages")).toBeNull();
    expect(parseFeedbackId("-1")).toBeNull();
    expect(parseFeedbackId("1.5")).toBeNull();
    expect(parseFeedbackId("abc")).toBeNull();
    expect(parseFeedbackId("")).toBeNull();
    expect(parseFeedbackId(undefined)).toBeNull();
    expect(parseFeedbackId("012")).toBeNull();
    expect(parseFeedbackId("1".repeat(20))).toBeNull();
  });
});

describe("selectFeedbackAdminRows", () => {
  it("明確列後台欄位、不使用 SELECT *", async () => {
    await selectFeedbackAdminRows();

    const { text } = lastCall();
    expect(text).not.toContain("SELECT *");
    for (const column of FEEDBACK_ADMIN_COLUMNS) {
      expect(text).toContain(column);
    }
    expect(text).toContain("ORDER BY created_at DESC");
  });

  it("不加 status 條件（待審／已隱藏都要看得到）", async () => {
    await selectFeedbackAdminRows();
    expect(lastCall().text).not.toContain("WHERE status");
  });

  it("limit 會被夾在 1–500", async () => {
    await selectFeedbackAdminRows(0);
    expect(lastCall().values[0]).toBe(1);

    await selectFeedbackAdminRows(9999);
    expect(lastCall().values[0]).toBe(500);

    await selectFeedbackAdminRows(Number.NaN);
    expect(lastCall().values[0]).toBe(200);
  });

  it("無 DATABASE_URL 就丟錯", async () => {
    vi.stubEnv("DATABASE_URL", "");
    await expect(selectFeedbackAdminRows()).rejects.toThrow("DATABASE_URL 未設定");
  });
});

describe("selectFeedbackStats", () => {
  it("只查 COUNT，不撈正文／暱稱／email", async () => {
    state.queue.push([
      {
        total: "3",
        pending: "1",
        published: "1",
        hidden: "1",
        needs_review: "1",
        story_request: "2",
      },
    ]);

    const stats = await selectFeedbackStats();

    const { text, values } = lastCall();
    // 排除表名 feedback_messages 後再檢查，避免把表名誤判成 message 欄位。
    const withoutTable = text.replaceAll("feedback_messages", "");
    expect(text).toContain("COUNT(*)");
    expect(text).not.toContain("SELECT *");
    expect(withoutTable).not.toContain("email");
    expect(withoutTable).not.toContain("nickname");
    expect(withoutTable).not.toContain("message");
    expect(values).toEqual(["pending", "published", "hidden", "story_request"]);
    expect(stats).toMatchObject({ pending: 1, published: 1, hidden: 1, storyRequest: 2 });
  });
});

describe("canTransitionFeedbackStatus", () => {
  it("pending 可以核准或隱藏", () => {
    expect(canTransitionFeedbackStatus("pending", "published")).toBe(true);
    expect(canTransitionFeedbackStatus("pending", "hidden")).toBe(true);
  });

  it("published 只能撤下成 hidden，不能直接退回 pending", () => {
    expect(canTransitionFeedbackStatus("published", "hidden")).toBe(true);
    expect(canTransitionFeedbackStatus("published", "pending")).toBe(false);
  });

  it("hidden 可以重新公開或退回待審", () => {
    expect(canTransitionFeedbackStatus("hidden", "published")).toBe(true);
    expect(canTransitionFeedbackStatus("hidden", "pending")).toBe(true);
  });
});

describe("updateFeedbackMessage", () => {
  it("核准會寫入 published 並回傳更新後的列", async () => {
    state.queue.push([{ id: 12, status: "pending" }]);
    state.queue.push([{ ...row, status: "published" }]);

    const result = await updateFeedbackMessage("12", { status: "published" });

    expect(result).toEqual({ ok: true, row: { ...row, status: "published" } });
    const { text, values } = lastCall();
    expect(text).toContain("UPDATE feedback_messages");
    expect(text).toContain("RETURNING");
    expect(text).not.toContain("RETURNING *");
    expect(values).toEqual(["published", null, "12"]);
  });

  it("只帶 kind 時 status 不動（COALESCE 保留原值）", async () => {
    state.queue.push([{ id: 12, status: "published" }]);
    state.queue.push([{ ...row, kind: "story_request" }]);

    const result = await updateFeedbackMessage("12", { kind: "story_request" });

    expect(result.ok).toBe(true);
    expect(lastCall().values).toEqual([null, "story_request", "12"]);
  });

  it("找不到 id 回 not_found，且不送 UPDATE", async () => {
    state.queue.push([]);

    const result = await updateFeedbackMessage("999", { status: "published" });

    expect(result).toEqual({ ok: false, reason: "not_found" });
    expect(state.calls).toHaveLength(1);
    expect(lastCall().text).toContain("SELECT id, status");
  });

  it("published → pending 被狀態機擋下", async () => {
    state.queue.push([{ id: 12, status: "published" }]);

    const result = await updateFeedbackMessage("12", { status: "pending" });

    expect(result).toEqual({ ok: false, reason: "invalid_transition" });
    expect(state.calls).toHaveLength(1);
  });
});

describe("deleteFeedbackMessage", () => {
  it("硬刪成功回 true", async () => {
    state.queue.push([{ id: 12 }]);

    await expect(deleteFeedbackMessage("12")).resolves.toBe(true);
    const { text, values } = lastCall();
    expect(text).toContain("DELETE FROM feedback_messages");
    expect(values).toEqual(["12"]);
  });

  it("沒刪到任何列回 false", async () => {
    state.queue.push([]);
    await expect(deleteFeedbackMessage("999")).resolves.toBe(false);
  });
});

describe("listFeedbackForModeration", () => {
  it("同時回聚合與 DTO 列表", async () => {
    state.queue.push([
      {
        total: "1",
        pending: "1",
        published: "0",
        hidden: "0",
        needs_review: "0",
        story_request: "0",
      },
    ]);
    state.queue.push([row]);

    const payload = await listFeedbackForModeration();

    expect(payload.stats.pending).toBe(1);
    expect(payload.messages).toHaveLength(1);
    expect(payload.messages[0]?.email).toBe("parent@example.com");
    expect(JSON.stringify(payload.stats)).not.toContain("parent@example.com");
  });
});
