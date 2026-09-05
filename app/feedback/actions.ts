"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import {
  FEEDBACK_HONEYPOT_FIELD,
  FEEDBACK_MIN_FILL_MS,
  FEEDBACK_STARTED_AT_FIELD,
  type FeedbackActionState,
} from "@/lib/feedback-action";
import {
  FEEDBACK_ERROR,
  FEEDBACK_RATE_LIMITED,
  FEEDBACK_SUCCESS,
  FEEDBACK_TOO_FAST,
  FEEDBACK_VALIDATION_ERROR,
} from "@/lib/feedback-copy";
import { isFeedbackDbConfigured } from "@/lib/feedback-db";
import { persistFeedbackSubmission } from "@/lib/feedback-submit";
import { feedbackBodySchema } from "@/lib/feedback-schema";
import { requestIpFromHeaders } from "@/lib/request-ip";

export async function submitFeedback(
  _prev: FeedbackActionState,
  formData: FormData,
): Promise<FeedbackActionState> {
  const honeypot = String(formData.get(FEEDBACK_HONEYPOT_FIELD) ?? "").trim();
  if (honeypot) {
    return { status: "success", message: FEEDBACK_SUCCESS };
  }

  const rawStarted = String(formData.get(FEEDBACK_STARTED_AT_FIELD) ?? "").trim();
  if (rawStarted) {
    const started = Number(rawStarted);
    if (Number.isFinite(started) && started > 0) {
      const elapsed = Date.now() - started;
      if (elapsed >= 0 && elapsed < FEEDBACK_MIN_FILL_MS) {
        return { status: "error", message: FEEDBACK_TOO_FAST };
      }
    }
  }

  if (!isFeedbackDbConfigured()) {
    return { status: "unavailable", message: FEEDBACK_ERROR };
  }

  const parsed = feedbackBodySchema.safeParse({
    nickname: formData.get("nickname"),
    email: formData.get("email"),
    message: formData.get("message"),
    parentConsent: formData.get("parentConsent") === "on",
    publishConsent: formData.get("publishConsent") === "on",
  });

  if (!parsed.success) {
    return { status: "error", message: FEEDBACK_VALIDATION_ERROR };
  }

  const persisted = await persistFeedbackSubmission({
    nickname: parsed.data.nickname,
    email: parsed.data.email,
    message: parsed.data.message,
    ip: requestIpFromHeaders(await headers()),
  });

  if (!persisted.ok) {
    if (persisted.reason === "unavailable") {
      return { status: "unavailable", message: FEEDBACK_ERROR };
    }
    if (persisted.reason === "rate_limited") {
      return { status: "error", message: FEEDBACK_RATE_LIMITED };
    }
    return { status: "error", message: FEEDBACK_ERROR };
  }

  revalidatePath("/feedback");
  return { status: "success", message: FEEDBACK_SUCCESS };
}
