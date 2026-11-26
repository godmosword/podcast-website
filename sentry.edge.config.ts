import * as Sentry from "@sentry/nextjs";
import { createServerSentryOptions } from "./lib/sentry-options";

Sentry.init(createServerSentryOptions());
