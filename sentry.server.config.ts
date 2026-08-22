import * as Sentry from "@sentry/nextjs";
import { sanitizeSentryEvent, sentryEnvironment } from "./lib/sentry-options";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: Boolean(process.env.SENTRY_DSN),
  environment: sentryEnvironment(),
  sendDefaultPii: false,
  tracesSampleRate: 0.1,
  beforeSend: sanitizeSentryEvent,
});
