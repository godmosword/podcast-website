import { captureException, init, type BrowserOptions } from "@sentry/browser";
import type { ErrorEvent, EventHint } from "@sentry/core";
import { sanitizeSentryEvent, sentryEnvironment } from "./sentry-options";

/**
 * Client init uses `@sentry/browser` instead of `@sentry/nextjs`.
 * `@sentry/nextjs` client `init` statically imports BrowserTracing, which
 * cannot be tree-shaken on the Turbopack production build (no withSentryConfig
 * webpack DefinePlugin). Default browser integrations still attach
 * GlobalHandlers at startup for unhandled errors and rejections.
 */
export function isNextRedirectError(subject: unknown): boolean {
  if (!(subject instanceof Error)) {
    return false;
  }
  const digest = (subject as Error & { digest?: string }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT;");
}

export function beforeSendClientEvent(
  event: ErrorEvent,
  hint?: EventHint,
): ErrorEvent | null {
  if (isNextRedirectError(hint?.originalException)) {
    return null;
  }
  if (event.exception?.values?.[0]?.value === "NEXT_REDIRECT") {
    return null;
  }
  return sanitizeSentryEvent(event);
}

export function createClientSentryOptions(): BrowserOptions {
  return {
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
    environment: sentryEnvironment(),
    sendDefaultPii: false,
    beforeSend: beforeSendClientEvent,
  };
}

export function initClientSentry(): void {
  init(createClientSentryOptions());
}

/**
 * `segment` 是區塊級邊界（地圖、遊戲、後台…），額外帶 `segment` tag 讓 Sentry
 * 能把「宇宙地圖壞了」和「遊戲畫布壞了」分開看，而不是全部混進 route。
 */
export function reportClientBoundaryError(
  error: Error & { digest?: string },
  boundary: "route" | "global" | "segment",
  segment?: string,
): void {
  captureException(error, {
    tags: {
      boundary,
      error_digest: error.digest ?? "unknown",
      ...(segment ? { segment } : {}),
    },
  });
}
