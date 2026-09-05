// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { FeedbackAdminDto } from "@/lib/feedback-admin";
import FeedbackModerationPanel, {
  MOD_APPROVE,
  MOD_DELETE,
  MOD_EMPTY,
  MOD_HIDE,
  MOD_LOGIN_FAILED,
  MOD_LOGIN_RATE_LIMITED,
  MOD_LOGIN_SUBMIT,
  MOD_PII_FLAG,
  MOD_SECRET_LABEL,
  MOD_UNAVAILABLE,
} from "./FeedbackModerationPanel";

vi.stubGlobal("React", React);

const FIXTURE_EMAIL = "parent@example.com";

const flagged: FeedbackAdminDto = {
  id: "12",
  nickname: "馬米",
  email: FIXTURE_EMAIL,
  message: "我在快樂幼兒園",
  kind: "general",
  status: "pending",
  needsReview: true,
  createdAt: "2026-09-05T02:00:00.000Z",
};

const clean: FeedbackAdminDto = {
  id: "13",
  nickname: "小車",
  email: "other@example.com",
  message: "想聽挖土機",
  kind: "story_request",
  status: "published",
  needsReview: false,
  createdAt: "2026-09-05T03:00:00.000Z",
};

const stats = {
  total: 2,
  pending: 1,
  published: 1,
  hidden: 0,
  needsReview: 1,
  storyRequest: 1,
};

type Call = { url: string; method: string; body: unknown };

function jsonResponse(status: number, payload: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  } as Response;
}

/** 依 url + method 派送假回應，並記錄呼叫供斷言。 */
function mockFetch(
  handler: (call: Call) => Response,
): { calls: Call[]; fn: ReturnType<typeof vi.fn> } {
  const calls: Call[] = [];
  const fn = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const call: Call = {
      url: String(input),
      method: init?.method ?? "GET",
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    };
    calls.push(call);
    return Promise.resolve(handler(call));
  });
  vi.stubGlobal("fetch", fn);
  return { calls, fn };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.stubGlobal("React", React);
});

describe("FeedbackModerationPanel", () => {
  test("未登入時顯示密語表單，不顯示任何留言", async () => {
    mockFetch(() => jsonResponse(401, { ok: false, reason: "unauthorized" }));

    render(<FeedbackModerationPanel />);

    expect(
      await screen.findByLabelText(MOD_SECRET_LABEL),
    ).toBeTruthy();
    expect(screen.queryByText(FIXTURE_EMAIL, { exact: false })).toBeNull();
    expect(screen.queryByRole("button", { name: MOD_APPROVE })).toBeNull();
  });

  test("密語錯誤顯示提示，且不進入列表", async () => {
    mockFetch((call) =>
      call.url.endsWith("/auth")
        ? jsonResponse(401, { ok: false, reason: "invalid_secret" })
        : jsonResponse(401, { ok: false, reason: "unauthorized" }),
    );

    render(<FeedbackModerationPanel />);
    fireEvent.change(await screen.findByLabelText(MOD_SECRET_LABEL), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: MOD_LOGIN_SUBMIT }));

    expect((await screen.findByRole("alert")).textContent).toBe(MOD_LOGIN_FAILED);
    expect(screen.getByLabelText(MOD_SECRET_LABEL)).toBeTruthy();
  });

  test("被鎖定時顯示稍後再試", async () => {
    mockFetch((call) =>
      call.url.endsWith("/auth")
        ? jsonResponse(429, { ok: false, reason: "rate_limited", retryAfterSec: 60 })
        : jsonResponse(401, { ok: false, reason: "unauthorized" }),
    );

    render(<FeedbackModerationPanel />);
    fireEvent.change(await screen.findByLabelText(MOD_SECRET_LABEL), {
      target: { value: "whatever" },
    });
    fireEvent.click(screen.getByRole("button", { name: MOD_LOGIN_SUBMIT }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      MOD_LOGIN_RATE_LIMITED,
    );
  });

  test("登入成功後載入統計與列表", async () => {
    let authed = false;
    const { calls } = mockFetch((call) => {
      if (call.url.endsWith("/auth")) {
        authed = true;
        return jsonResponse(200, { ok: true });
      }
      return authed
        ? jsonResponse(200, { ok: true, stats, messages: [flagged, clean] })
        : jsonResponse(401, { ok: false, reason: "unauthorized" });
    });

    render(<FeedbackModerationPanel />);
    fireEvent.change(await screen.findByLabelText(MOD_SECRET_LABEL), {
      target: { value: "super-secret-passphrase" },
    });
    fireEvent.click(screen.getByRole("button", { name: MOD_LOGIN_SUBMIT }));

    expect(await screen.findByText("我在快樂幼兒園")).toBeTruthy();
    expect(calls.some((c) => c.url.endsWith("/auth") && c.method === "POST")).toBe(true);
    // 密語只在 POST body，不會被放進 query string。
    expect(calls.every((c) => !c.url.includes("secret"))).toBe(true);
  });

  test("疑似個資用顯性文字標示，不是只靠透明度", async () => {
    mockFetch(() => jsonResponse(200, { ok: true, stats, messages: [flagged, clean] }));

    render(<FeedbackModerationPanel />);

    const flag = await screen.findByText(MOD_PII_FLAG);
    expect(flag).toBeTruthy();
    // 只有命中的那則有旗標。
    expect(screen.getAllByText(MOD_PII_FLAG)).toHaveLength(1);
  });

  test("後台列顯示 email，公開牆不會有的欄位在這裡看得到", async () => {
    mockFetch(() => jsonResponse(200, { ok: true, stats, messages: [flagged] }));

    render(<FeedbackModerationPanel />);

    expect(await screen.findByText(FIXTURE_EMAIL, { exact: false })).toBeTruthy();
  });

  test("核准送出 PATCH published 並重新載入", async () => {
    const { calls } = mockFetch((call) => {
      if (call.method === "PATCH") return jsonResponse(200, { ok: true });
      return jsonResponse(200, { ok: true, stats, messages: [flagged] });
    });

    render(<FeedbackModerationPanel />);
    fireEvent.click(
      await screen.findByRole("button", { name: `${MOD_APPROVE}：馬米` }),
    );

    await waitFor(() => {
      expect(calls.some((c) => c.method === "PATCH")).toBe(true);
    });
    const patch = calls.find((c) => c.method === "PATCH");
    expect(patch?.url).toBe("/api/studio/feedback/12");
    expect(patch?.body).toEqual({ status: "published" });
  });

  test("隱藏送出 PATCH hidden", async () => {
    const { calls } = mockFetch((call) =>
      call.method === "PATCH"
        ? jsonResponse(200, { ok: true })
        : jsonResponse(200, { ok: true, stats, messages: [clean] }),
    );

    render(<FeedbackModerationPanel />);
    fireEvent.click(await screen.findByRole("button", { name: `${MOD_HIDE}：小車` }));

    await waitFor(() => {
      expect(calls.find((c) => c.method === "PATCH")?.body).toEqual({
        status: "hidden",
      });
    });
  });

  test("已公開的那則不能重複核准（按鈕 disabled）", async () => {
    mockFetch(() => jsonResponse(200, { ok: true, stats, messages: [clean] }));

    render(<FeedbackModerationPanel />);

    const approve = await screen.findByRole("button", { name: `${MOD_APPROVE}：小車` });
    expect(approve.hasAttribute("disabled")).toBe(true);
  });

  test("刪除要二次確認：取消就不送 DELETE", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    const { calls } = mockFetch(() =>
      jsonResponse(200, { ok: true, stats, messages: [flagged] }),
    );

    render(<FeedbackModerationPanel />);
    fireEvent.click(await screen.findByRole("button", { name: `${MOD_DELETE}：馬米` }));

    expect(confirmSpy).toHaveBeenCalled();
    expect(calls.some((c) => c.method === "DELETE")).toBe(false);
  });

  test("刪除確認後送出 DELETE", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const { calls } = mockFetch((call) =>
      call.method === "DELETE"
        ? jsonResponse(200, { ok: true })
        : jsonResponse(200, { ok: true, stats, messages: [flagged] }),
    );

    render(<FeedbackModerationPanel />);
    fireEvent.click(await screen.findByRole("button", { name: `${MOD_DELETE}：馬米` }));

    await waitFor(() => {
      expect(
        calls.some(
          (c) => c.method === "DELETE" && c.url === "/api/studio/feedback/12",
        ),
      ).toBe(true);
    });
  });

  test("session 過期（401）時退回密語表單", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    let expired = false;
    mockFetch((call) => {
      if (call.method === "DELETE") {
        expired = true;
        return jsonResponse(401, { ok: false, reason: "unauthorized" });
      }
      return expired
        ? jsonResponse(401, { ok: false, reason: "unauthorized" })
        : jsonResponse(200, { ok: true, stats, messages: [flagged] });
    });

    render(<FeedbackModerationPanel />);
    fireEvent.click(await screen.findByRole("button", { name: `${MOD_DELETE}：馬米` }));

    expect(await screen.findByLabelText(MOD_SECRET_LABEL)).toBeTruthy();
  });

  test("沒有留言時顯示空狀態，不是空白畫面", async () => {
    mockFetch(() =>
      jsonResponse(200, {
        ok: true,
        stats: { ...stats, total: 0, pending: 0, published: 0, needsReview: 0, storyRequest: 0 },
        messages: [],
      }),
    );

    render(<FeedbackModerationPanel />);

    expect(await screen.findByText(MOD_EMPTY)).toBeTruthy();
  });

  test("API 503 時顯示暫時無法使用", async () => {
    mockFetch(() => jsonResponse(503, { ok: false, reason: "db_unavailable" }));

    render(<FeedbackModerationPanel />);

    expect((await screen.findByRole("status")).textContent).toBe(MOD_UNAVAILABLE);
  });
});
