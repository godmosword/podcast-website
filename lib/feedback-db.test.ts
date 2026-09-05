import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  FEEDBACK_PUBLIC_COLUMNS,
  insertFeedbackMessage,
  isFeedbackDbConfigured,
  selectPublishedFeedbackRows,
  toPublicDto,
  type FeedbackPublicRow,
} from "./feedback-db";

type SqlCall = { text: string; values: unknown[] };

const state = vi.hoisted(() => ({
  calls: [] as { text: string; values: unknown[] }[],
  rows: [] as unknown[],
}));

// 以假的 tagged template 取代 neon，用來檢查實際送出的 SQL 與參數。
vi.mock("@neondatabase/serverless", () => ({
  neon:
    () =>
    (strings: TemplateStringsArray, ...values: unknown[]) => {
      state.calls.push({ text: strings.join(" ? "), values });
      return Promise.resolve(state.rows);
    },
}));

function lastCall(): SqlCall {
  const call = state.calls.at(-1);
  if (!call) throw new Error("沒有 SQL 呼叫");
  return call;
}

beforeEach(() => {
  state.calls.length = 0;
  state.rows = [];
  vi.stubEnv("DATABASE_URL", "postgresql://user:pw@localhost/db");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isFeedbackDbConfigured", () => {
  it("有 DATABASE_URL 才算可用", () => {
    expect(isFeedbackDbConfigured()).toBe(true);
    vi.stubEnv("DATABASE_URL", "   ");
    expect(isFeedbackDbConfigured()).toBe(false);
    vi.stubEnv("DATABASE_URL", "");
    expect(isFeedbackDbConfigured()).toBe(false);
  });
});

describe("toPublicDto", () => {
  it("只輸出公開白名單四欄位", () => {
    const dto = toPublicDto({
      id: 7,
      nickname: "馬米",
      message: "你好",
      created_at: "2026-09-05T02:00:00.000Z",
    });

    expect(Object.keys(dto).sort()).toEqual(["createdAt", "id", "message", "nickname"]);
    expect(dto).toEqual({
      id: 7,
      nickname: "馬米",
      message: "你好",
      createdAt: "2026-09-05T02:00:00.000Z",
    });
  });

  it("即使 row 夾帶 email／status／kind 也不會外流", () => {
    const polluted = {
      id: "8",
      nickname: "小車",
      message: "哈囉",
      created_at: new Date("2026-09-05T03:00:00.000Z"),
      email: "parent@example.com",
      status: "pending",
      kind: "story_request",
      needs_review: true,
    } as FeedbackPublicRow;

    const dto = toPublicDto(polluted);

    expect(JSON.stringify(dto)).not.toContain("parent@example.com");
    expect(JSON.stringify(dto)).not.toContain("pending");
    expect(dto).toEqual({
      id: "8",
      nickname: "小車",
      message: "哈囉",
      createdAt: "2026-09-05T03:00:00.000Z",
    });
  });

  it("createdAt 一律轉 ISO 字串", () => {
    const dto = toPublicDto({
      id: 1,
      nickname: "a",
      message: "b",
      created_at: new Date("2026-01-02T03:04:05.000Z"),
    });
    expect(dto.createdAt).toBe("2026-01-02T03:04:05.000Z");
  });
});

describe("selectPublishedFeedbackRows", () => {
  it("明確列公開欄位、不使用 SELECT *", async () => {
    await selectPublishedFeedbackRows();

    const { text } = lastCall();
    expect(text).not.toContain("SELECT *");
    for (const column of FEEDBACK_PUBLIC_COLUMNS) {
      expect(text).toContain(column);
    }
    expect(text).not.toContain("email");
    expect(text).not.toContain("needs_review");
    expect(text).not.toContain("consent_version");
  });

  it("只取 published 並依時間倒序", async () => {
    await selectPublishedFeedbackRows(10);

    const { text, values } = lastCall();
    expect(text).toContain("WHERE status =");
    expect(text).toContain("ORDER BY created_at DESC");
    expect(values[0]).toBe("published");
    expect(values[1]).toBe(10);
  });

  it("limit 會被夾在 1–100", async () => {
    await selectPublishedFeedbackRows(0);
    expect(lastCall().values[1]).toBe(1);

    await selectPublishedFeedbackRows(9999);
    expect(lastCall().values[1]).toBe(100);

    await selectPublishedFeedbackRows(Number.NaN);
    expect(lastCall().values[1]).toBe(50);
  });

  it("回傳 DB 列", async () => {
    state.rows = [
      { id: 1, nickname: "馬米", message: "你好", created_at: "2026-09-05T00:00:00.000Z" },
    ];
    const rows = await selectPublishedFeedbackRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.nickname).toBe("馬米");
  });

  it("無 DATABASE_URL 就丟錯", async () => {
    vi.stubEnv("DATABASE_URL", "");
    await expect(selectPublishedFeedbackRows()).rejects.toThrow("DATABASE_URL 未設定");
  });
});

describe("insertFeedbackMessage", () => {
  const input = {
    nickname: "馬米",
    email: "parent@example.com",
    message: "你好",
    kind: "general" as const,
    needsReview: false,
    consentVersion: "2026-09-05",
    consentedAt: new Date("2026-09-05T04:00:00.000Z"),
  };

  it("寫入 pending 狀態與 server 端 consent 欄位", async () => {
    await insertFeedbackMessage(input);

    const { text, values } = lastCall();
    expect(text).toContain("INSERT INTO feedback_messages");
    expect(values).toEqual([
      "馬米",
      "parent@example.com",
      "你好",
      "general",
      "pending",
      false,
      "2026-09-05",
      "2026-09-05T04:00:00.000Z",
    ]);
  });

  it("needs_review 命中時寫 true", async () => {
    await insertFeedbackMessage({ ...input, needsReview: true });
    expect(lastCall().values[5]).toBe(true);
  });

  it("無 DATABASE_URL 就丟錯", async () => {
    vi.stubEnv("DATABASE_URL", "");
    await expect(insertFeedbackMessage(input)).rejects.toThrow("DATABASE_URL 未設定");
  });
});
