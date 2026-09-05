import { afterEach, describe, expect, it, vi } from "vitest";
import { requestIp, requestIpFromHeaders } from "./request-ip";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("requestIp", () => {
  it("非 production 可讀 x-forwarded-for 第一個", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("VERCEL_ENV", "");
    const request = new Request("http://localhost/api/feedback", {
      headers: { "x-forwarded-for": "203.0.113.20, 10.0.0.1" },
    });
    expect(requestIp(request)).toBe("203.0.113.20");
  });

  it("production 不採信 x-forwarded-for", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    const request = new Request("http://localhost/api/feedback", {
      headers: { "x-forwarded-for": "203.0.113.20" },
    });
    expect(requestIp(request)).toBe("unknown");
  });
});

describe("requestIpFromHeaders", () => {
  it("與 Request 路徑讀同一組 header", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("VERCEL_ENV", "");
    const headers = new Headers({ "x-forwarded-for": "198.51.100.10" });
    expect(requestIpFromHeaders(headers)).toBe("198.51.100.10");
  });
});
