import * as Sentry from "@sentry/nextjs";
import { sanitizeSentryEvent, sentryEnvironment } from "./lib/sentry-options";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  environment: sentryEnvironment(),
  sendDefaultPii: false,
  tracesSampleRate: 0.1,
  beforeSend: sanitizeSentryEvent,
});
