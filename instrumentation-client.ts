import { initClientSentry } from "./lib/sentry-client";

// Runs at client startup (not idle/lazy) so unhandled errors are captured.
initClientSentry();
