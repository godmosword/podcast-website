import type { DataCollection, ErrorEvent, StreamedSpanJSON } from "@sentry/core";

/**
 * Sentry 11 沒有 `sendDefaultPii`，不設 `dataCollection` 就預設全收。這裡全部關掉，
 * 用 `Required` 逼之後升版新增的類別也要明確表態。
 * 錯誤事件另外再過 `sanitizeSentryEvent`，效能 span 過 `sanitizeSentrySpan`。
 */
export const SENTRY_DATA_COLLECTION = {
  userInfo: false,
  cookies: false,
  httpHeaders: { request: false, response: false },
  httpBodies: [],
  urlQueryParams: false,
  graphQL: { document: false, variables: false },
  genAI: { inputs: false, outputs: false },
  mcp: { inputs: false, outputs: false },
  databaseQueryData: false,
  queues: false,
  stackFrameVariables: false,
  // 堆疊前後的程式碼行數，不含使用者資料；維持 Sentry 預設。
  frameContextLines: 5,
} satisfies Required<DataCollection>;

/** node 與 edge 的 `Sentry.init` 共用。 */
export function createServerSentryOptions() {
  return {
    dsn: process.env.SENTRY_DSN,
    enabled: Boolean(process.env.SENTRY_DSN),
    environment: sentryEnvironment(),
    dataCollection: SENTRY_DATA_COLLECTION,
    tracesSampleRate: 0.1,
    beforeSend: sanitizeSentryEvent,
    beforeSendSpan: sanitizeSentrySpan,
  };
}

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

const DROPPED_SPAN_ATTRIBUTES = new Set(["url.query", "url.fragment"]);

function stripQuery(value: string): string {
  return value.replace(/[?#].*$/s, "");
}

function stripQueryDeep(value: unknown): unknown {
  if (typeof value === "string") return stripQuery(value);
  return Array.isArray(value) ? value.map(stripQueryDeep) : value;
}

/**
 * Next 自己的 OpenTelemetry span 會把含參數的網址寫進 `http.target`，`dataCollection` 管不到，
 * 所以送出前把名稱與字串屬性的 `?`、`#` 之後都拿掉。不分屬性一律截，寧可少一點診斷資訊。
 */
export function sanitizeSentrySpan(span: StreamedSpanJSON): StreamedSpanJSON {
  const attributes = Object.fromEntries(
    Object.entries(span.attributes)
      .filter(([key]) => !DROPPED_SPAN_ATTRIBUTES.has(key))
      .map(([key, value]) => [key, stripQueryDeep(value)]),
  );
  return { ...span, name: stripQuery(span.name), attributes };
}

export function sentryEnvironment(): string {
  return (
    process.env.SENTRY_ENVIRONMENT?.trim() ||
    process.env.VERCEL_ENV?.trim() ||
    process.env.NODE_ENV ||
    "development"
  );
}
