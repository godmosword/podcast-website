import { describe, expect, it } from "vitest";
import type { ErrorEvent } from "@sentry/core";
import { sanitizeSentryEvent, sentryEnvironment } from "./sentry-options";

function asErrorEvent(event: object): ErrorEvent {
  return event as unknown as ErrorEvent;
}

describe("sanitizeSentryEvent", () => {
  it("strips query, headers, body, cookies and user before send", () => {
    const sanitized = sanitizeSentryEvent(asErrorEvent({
      request: {
        url: "https://chechecar.tw/play?token=abc",
        headers: { authorization: "Bearer x" },
        data: { email: "a@b.c" },
        query_string: "token=abc",
        cookies: { sid: "1" },
      },
      user: { ip_address: "1.2.3.4" },
      extra: { family: "secret" },
    }));
    expect(sanitized.request?.url).toBe("https://chechecar.tw/play");
    expect(sanitized.request?.headers).toBeUndefined();
    expect(sanitized.request?.data).toBeUndefined();
    expect(sanitized.request?.query_string).toBeUndefined();
    expect(sanitized.request?.cookies).toBeUndefined();
    expect(sanitized.user).toBeUndefined();
    expect(sanitized.extra).toBeUndefined();
  });

  it("redacts unparseable request URLs", () => {
    const sanitized = sanitizeSentryEvent(asErrorEvent({
      request: { url: "not a url" },
    }));
    expect(sanitized.request?.url).toBe("(redacted)");
  });
});

describe("sentryEnvironment", () => {
  it("prefers SENTRY_ENVIRONMENT then VERCEL_ENV then NODE_ENV", () => {
    const sentry = process.env.SENTRY_ENVIRONMENT;
    const vercel = process.env.VERCEL_ENV;
    const node = process.env.NODE_ENV;
    delete process.env.SENTRY_ENVIRONMENT;
    delete process.env.VERCEL_ENV;
    expect(sentryEnvironment()).toBe(node || "development");
    process.env.VERCEL_ENV = "preview";
    expect(sentryEnvironment()).toBe("preview");
    process.env.SENTRY_ENVIRONMENT = "staging";
    expect(sentryEnvironment()).toBe("staging");
    if (sentry === undefined) {
      delete process.env.SENTRY_ENVIRONMENT;
    } else {
      process.env.SENTRY_ENVIRONMENT = sentry;
    }
    if (vercel === undefined) {
      delete process.env.VERCEL_ENV;
    } else {
      process.env.VERCEL_ENV = vercel;
    }
  });
});
