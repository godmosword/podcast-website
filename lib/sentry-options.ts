import type { ErrorEvent } from "@sentry/core";

/** Remove query strings, headers and user data before an event leaves the site. */
export function sanitizeSentryEvent(event: ErrorEvent): ErrorEvent {
  if (event.request) {
    const rawUrl = event.request.url;
    let safeUrl = rawUrl;
    try {
      const url = new URL(rawUrl ?? "");
      safeUrl = `${url.origin}${url.pathname}`;
    } catch {
      safeUrl = "(redacted)";
    }
    event.request = {
      ...event.request,
      url: safeUrl,
      headers: undefined,
      data: undefined,
      query_string: undefined,
      cookies: undefined,
    };
  }
  event.user = undefined;
  event.extra = undefined;
  return event;
}

export function sentryEnvironment(): string {
  return (
    process.env.SENTRY_ENVIRONMENT?.trim() ||
    process.env.VERCEL_ENV?.trim() ||
    process.env.NODE_ENV ||
    "development"
  );
}
