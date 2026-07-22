import { describe, expect, it } from "vitest";
import nextConfig from "./next.config";

describe("next security headers", () => {
  it("sets baseline browser hardening headers for every route", async () => {
    const groups = await nextConfig.headers?.();
    const allHeaders = groups?.flatMap((group) => group.headers) ?? [];

    expect(allHeaders).toEqual(
      expect.arrayContaining([
        { key: "X-Content-Type-Options", value: "nosniff" },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=(), payment=()",
        },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
      ]),
    );
  });
});
