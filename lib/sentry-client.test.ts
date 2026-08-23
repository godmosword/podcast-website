import { afterEach, describe, expect, it } from "vitest";
import type { ErrorEvent } from "@sentry/core";
import {
  beforeSendClientEvent,
  createClientSentryOptions,
  isNextRedirectError,
} from "./sentry-client";

function asErrorEvent(event: object): ErrorEvent {
  return event as unknown as ErrorEvent;
}

const previousPublicDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

afterEach(() => {
  if (previousPublicDsn === undefined) {
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;
  } else {
    process.env.NEXT_PUBLIC_SENTRY_DSN = previousPublicDsn;
  }
});

describe("createClientSentryOptions", () => {
  it("keeps early error capture defaults and omits tracing sample policy", () => {
    const options = createClientSentryOptions();
    expect(options).not.toHaveProperty("tracesSampleRate");
    expect(options).not.toHaveProperty("replaysSessionSampleRate");
    expect(options).not.toHaveProperty("integrations");
    expect(options).not.toHaveProperty("defaultIntegrations");
    expect(options.sendDefaultPii).toBe(false);
    expect(options.beforeSend).toBe(beforeSendClientEvent);
  });

  it("enables the client only when a public DSN is present", () => {
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;
    expect(createClientSentryOptions().enabled).toBe(false);
    process.env.NEXT_PUBLIC_SENTRY_DSN = "https://public@127.0.0.1/1";
    expect(createClientSentryOptions().enabled).toBe(true);
  });
});

describe("beforeSendClientEvent", () => {
  it("drops Next.js redirect errors so they are not reported as failures", () => {
    const redirect = new Error("NEXT_REDIRECT");
    (redirect as Error & { digest: string }).digest = "NEXT_REDIRECT;replace;/stories";
    expect(isNextRedirectError(redirect)).toBe(true);
    expect(
      beforeSendClientEvent(asErrorEvent({ exception: { values: [{ value: "NEXT_REDIRECT" }] } })),
    ).toBeNull();
    expect(
      beforeSendClientEvent(asErrorEvent({ exception: { values: [{ value: "boom" }] } }), {
        originalException: redirect,
      }),
    ).toBeNull();
  });

  it("scrubs query strings and user data from real exceptions", () => {
    const sanitized = beforeSendClientEvent(asErrorEvent({
      exception: { values: [{ value: "boom" }] },
      request: {
        url: "https://chechecar.tw/stories?tag=secret",
        headers: { cookie: "session=1" },
        query_string: "tag=secret",
      },
      user: { email: "parent@example.com" },
      extra: { progress: "ep-1" },
    }));
    expect(sanitized).not.toBeNull();
    expect(sanitized?.request?.url).toBe("https://chechecar.tw/stories");
    expect(sanitized?.request?.headers).toBeUndefined();
    expect(sanitized?.request?.query_string).toBeUndefined();
    expect(sanitized?.user).toBeUndefined();
    expect(sanitized?.extra).toBeUndefined();
  });
});

describe("production-like capture with mock transport", () => {
  it("captures startup and post-init exceptions without talking to Sentry SaaS", async () => {
    const { captureException, flush, getClient, init } = await import("@sentry/browser");
    const { reportClientBoundaryError } = await import("./sentry-client");
    const envelopes: unknown[] = [];
    init({
      ...createClientSentryOptions(),
      dsn: "https://public@127.0.0.1/1",
      enabled: true,
      transport: () => ({
        send: async (envelope) => {
          envelopes.push(envelope);
          return { statusCode: 200 };
        },
        flush: async () => true,
      }),
    });
    captureException(new Error("intentional-client-exception"));
    await flush(2000);
    expect(envelopes.length).toBeGreaterThan(0);
    const firstCount = envelopes.length;
    reportClientBoundaryError(
      Object.assign(new Error("post-init-client-exception"), { digest: "play-1" }),
      "route",
    );
    await flush(2000);
    expect(envelopes.length).toBeGreaterThan(firstCount);
    const serialized = JSON.stringify(envelopes);
    expect(serialized).toContain("intentional-client-exception");
    expect(serialized).toContain("post-init-client-exception");
    await getClient()?.close();
  });
});
