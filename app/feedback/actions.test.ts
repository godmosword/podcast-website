import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  FEEDBACK_ERROR,
  FEEDBACK_RATE_LIMITED,
  FEEDBACK_SUCCESS,
  FEEDBACK_TOO_FAST,
  FEEDBACK_VALIDATION_ERROR,
} from "@/lib/feedback-copy";
import { LEGAL_POLICY_VERSION } from "@/lib/legal-policy";
import {
  FEEDBACK_ACTION_IDLE,
  FEEDBACK_HONEYPOT_FIELD,
  FEEDBACK_MIN_FILL_MS,
  FEEDBACK_STARTED_AT_FIELD,
} from "@/lib/feedback-action";
import { submitFeedback } from "./actions";

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ "x-forwarded-for": "203.0.113.80" })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/feedback-db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/feedback-db")>();
  return { ...actual, isFeedbackDbConfigured: vi.fn() };
});

vi.mock("@/lib/feedback-query", () => ({
  createFeedbackMessage: vi.fn(),
  listPublishedFeedback: vi.fn(),
}));

function filledForm(overrides: Record<string, string | null> = {}): FormData {
  const data = new FormData();
  data.set("nickname", "Bonbon");
  data.set("email", "parent@example.com");
  data.set("message", "謝謝馬米");
  data.set("parentConsent", "on");
  data.set("publishConsent", "on");
  data.set(FEEDBACK_HONEYPOT_FIELD, "");
  data.set(FEEDBACK_STARTED_AT_FIELD, String(Date.now() - FEEDBACK_MIN_FILL_MS - 50));

  for (const [key, value] of Object.entries(overrides)) {
    if (value == null) {
      data.delete(key);
    } else {
      data.set(key, value);
    }
  }

  return data;
}

async function mockDbAvailable(available: boolean): Promise<void> {
  const { isFeedbackDbConfigured } = await import("@/lib/feedback-db");
  vi.mocked(isFeedbackDbConfigured).mockReturnValue(available);
}

beforeEach(async () => {
  vi.clearAllMocks();
  const { resetFeedbackRateLimits } = await import("@/lib/feedback-rate-limit");
  resetFeedbackRateLimits();
});

afterEach(async () => {
  vi.unstubAllEnvs();
  const { resetFeedbackRateLimits } = await import("@/lib/feedback-rate-limit");
  resetFeedbackRateLimits();
});

describe("submitFeedback", () => {
  it("蜜罐有值時假裝成功且不寫庫", async () => {
    await mockDbAvailable(true);
    const { createFeedbackMessage } = await import("@/lib/feedback-query");
    const { revalidatePath } = await import("next/cache");

    const state = await submitFeedback(
      FEEDBACK_ACTION_IDLE,
      filledForm({ [FEEDBACK_HONEYPOT_FIELD]: "https://spam.test" }),
    );

    expect(state).toEqual({ status: "success", message: FEEDBACK_SUCCESS });
    expect(createFeedbackMessage).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("未勾同意退件", async () => {
    await mockDbAvailable(true);
    const { createFeedbackMessage } = await import("@/lib/feedback-query");

    const state = await submitFeedback(
      FEEDBACK_ACTION_IDLE,
      filledForm({ parentConsent: null }),
    );

    expect(state).toEqual({ status: "error", message: FEEDBACK_VALIDATION_ERROR });
    expect(createFeedbackMessage).not.toHaveBeenCalled();
  });

  it("填太快退件且不暴露機器人", async () => {
    await mockDbAvailable(true);
    const { createFeedbackMessage } = await import("@/lib/feedback-query");

    const state = await submitFeedback(
      FEEDBACK_ACTION_IDLE,
      filledForm({ [FEEDBACK_STARTED_AT_FIELD]: String(Date.now() - 200) }),
    );

    expect(state).toEqual({ status: "error", message: FEEDBACK_TOO_FAST });
    expect(state.message).not.toMatch(/機器|bot|spam/i);
    expect(createFeedbackMessage).not.toHaveBeenCalled();
  });

  it("無 startedAt（無 JS）略過計時並可收件", async () => {
    await mockDbAvailable(true);
    const { createFeedbackMessage } = await import("@/lib/feedback-query");
    vi.mocked(createFeedbackMessage).mockResolvedValue({ needsReview: false, reasons: [] });

    const state = await submitFeedback(
      FEEDBACK_ACTION_IDLE,
      filledForm({ [FEEDBACK_STARTED_AT_FIELD]: null }),
    );

    expect(state).toEqual({ status: "success", message: FEEDBACK_SUCCESS });
    expect(createFeedbackMessage).toHaveBeenCalledWith({
      nickname: "Bonbon",
      email: "parent@example.com",
      message: "謝謝馬米",
      consentVersion: LEGAL_POLICY_VERSION,
      consentedAt: expect.any(Date),
    });
  });

  it("無 DB 降級 unavailable", async () => {
    await mockDbAvailable(false);
    const { createFeedbackMessage } = await import("@/lib/feedback-query");

    const state = await submitFeedback(FEEDBACK_ACTION_IDLE, filledForm());

    expect(state).toEqual({ status: "unavailable", message: FEEDBACK_ERROR });
    expect(createFeedbackMessage).not.toHaveBeenCalled();
  });

  it("有效留言寫 pending 並 revalidate", async () => {
    await mockDbAvailable(true);
    const { createFeedbackMessage } = await import("@/lib/feedback-query");
    const { revalidatePath } = await import("next/cache");
    vi.mocked(createFeedbackMessage).mockResolvedValue({ needsReview: false, reasons: [] });

    const state = await submitFeedback(FEEDBACK_ACTION_IDLE, filledForm());

    expect(state).toEqual({ status: "success", message: FEEDBACK_SUCCESS });
    expect(createFeedbackMessage).toHaveBeenCalledTimes(1);
    expect(revalidatePath).toHaveBeenCalledWith("/feedback");
  });

  it("節流時回友善錯誤、不寫庫", async () => {
    await mockDbAvailable(true);
    const { createFeedbackMessage } = await import("@/lib/feedback-query");
    vi.mocked(createFeedbackMessage).mockResolvedValue({ needsReview: false, reasons: [] });

    for (let i = 0; i < 10; i += 1) {
      const res = await submitFeedback(
        FEEDBACK_ACTION_IDLE,
        filledForm({ email: `parent${i}@example.com` }),
      );
      expect(res.status).toBe("success");
    }

    const blocked = await submitFeedback(
      FEEDBACK_ACTION_IDLE,
      filledForm({ email: "parent99@example.com" }),
    );

    expect(blocked).toEqual({ status: "error", message: FEEDBACK_RATE_LIMITED });
    expect(createFeedbackMessage).toHaveBeenCalledTimes(10);
  });
});
