// @vitest-environment jsdom
import React from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.stubGlobal("React", React);

const reportClientBoundaryError = vi.fn();

vi.mock("@/lib/sentry-client", () => ({
  reportClientBoundaryError,
}));

vi.mock("@/components/dudu/DuduMoment", () => ({
  default: () => <div>dudu</div>,
}));

vi.mock("@/components/SiteFooter", () => ({
  default: () => <footer>footer</footer>,
}));

afterEach(() => {
  cleanup();
  reportClientBoundaryError.mockClear();
});

describe("route error boundary", () => {
  it("reports the error to Sentry when the boundary mounts", async () => {
    const { default: ErrorBoundary } = await import("./error");
    const error = Object.assign(new Error("route exploded"), { digest: "abc123" });
    render(<ErrorBoundary error={error} reset={() => undefined} />);
    expect(reportClientBoundaryError).toHaveBeenCalledTimes(1);
    expect(reportClientBoundaryError).toHaveBeenCalledWith(error, "route");
  });
});


