import { expect, it, vi } from "vitest";

vi.mock("./lib/sentry-client", () => ({
  initClientSentry: vi.fn(),
}));

import { initClientSentry } from "./lib/sentry-client";
import "./instrumentation-client";

it("initializes the client SDK at module load so startup errors can be captured", () => {
  expect(initClientSentry).toHaveBeenCalledTimes(1);
});
