import { describe, expect, it } from "vitest";
import type { ErrorEvent, StreamedSpanJSON } from "@sentry/core";
import {
  createServerSentryOptions,
  sanitizeSentryEvent,
  sanitizeSentrySpan,
  SENTRY_DATA_COLLECTION,
  sentryEnvironment,
} from "./sentry-options";

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

describe("SENTRY_DATA_COLLECTION", () => {
  // Sentry 11 拿掉 sendDefaultPii，不設 dataCollection 就預設全收。
  it("不收使用者、cookie、標頭、內文、網址參數與區域變數", () => {
    expect(SENTRY_DATA_COLLECTION).toMatchObject({
      userInfo: false,
      cookies: false,
      httpHeaders: { request: false, response: false },
      httpBodies: [],
      urlQueryParams: false,
      databaseQueryData: false,
      stackFrameVariables: false,
    });
  });

  it("除了程式碼前後文，每一類都關掉", () => {
    const { frameContextLines, ...collected } = SENTRY_DATA_COLLECTION;
    expect(frameContextLines).toBeGreaterThan(0);
    expect(JSON.stringify(collected)).not.toContain("true");
  });
});

describe("sanitizeSentrySpan", () => {
  const span: StreamedSpanJSON = {
    trace_id: "t",
    span_id: "s",
    name: "GET /api/x?email=a@b.c",
    start_timestamp: 1,
    status: "ok",
    is_segment: true,
    attributes: {
      // Next 自己的 OpenTelemetry span 會帶，dataCollection 管不到。
      "http.target": "/api/x?email=a@b.c",
      "url.full": "https://carcarplayground.com/story/ep-1?token=abc#frag",
      "url.query": "token=abc",
      "url.fragment": "frag",
      "http.method": "GET",
      "http.status_code": 200,
      "next.span_name": "GET /api/x?email=a@b.c",
    },
  };

  it("名稱與網址類屬性去掉 ? 與 # 之後，其餘照舊", () => {
    expect(sanitizeSentrySpan(span)).toEqual({
      ...span,
      name: "GET /api/x",
      attributes: {
        "http.target": "/api/x",
        "url.full": "https://carcarplayground.com/story/ep-1",
        "http.method": "GET",
        "http.status_code": 200,
        "next.span_name": "GET /api/x",
      },
    });
  });

  it("字串陣列逐項清理，數字陣列照舊", () => {
    const cleaned = sanitizeSentrySpan({
      ...span,
      attributes: { "http.links": ["/a?email=a@b.c", "/b#x"], "x.sizes": [1, 2] },
    });
    expect(cleaned.attributes).toEqual({ "http.links": ["/a", "/b"], "x.sizes": [1, 2] });
  });

  it("不改到傳進來的 span", () => {
    const before = structuredClone(span);
    sanitizeSentrySpan(span);
    expect(span).toEqual(before);
  });
});

describe("createServerSentryOptions", () => {
  it("node 與 edge 共用：帶 dataCollection、清理函式，沒有 DSN 就不啟用", () => {
    const dsn = process.env.SENTRY_DSN;
    delete process.env.SENTRY_DSN;
    expect(createServerSentryOptions()).toMatchObject({
      enabled: false,
      tracesSampleRate: 0.1,
      dataCollection: SENTRY_DATA_COLLECTION,
      beforeSend: sanitizeSentryEvent,
      beforeSendSpan: sanitizeSentrySpan,
    });
    process.env.SENTRY_DSN = "https://public@127.0.0.1/1";
    expect(createServerSentryOptions().enabled).toBe(true);
    if (dsn === undefined) {
      delete process.env.SENTRY_DSN;
    } else {
      process.env.SENTRY_DSN = dsn;
    }
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
