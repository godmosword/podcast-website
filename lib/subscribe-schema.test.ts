import { describe, expect, it } from "vitest";
import { subscribeBodySchema } from "./subscribe-schema";

describe("subscribeBodySchema", () => {
  it("有效 email + 家長同意", () => {
    const parsed = subscribeBodySchema.safeParse({
      email: "parent@example.com",
      parentConsent: true,
      source: "subscribe_page",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.email).toBe("parent@example.com");
      expect(parsed.data.source).toBe("subscribe_page");
    }
  });

  it("未勾選同意拒絕", () => {
    const parsed = subscribeBodySchema.safeParse({
      email: "parent@example.com",
      parentConsent: false,
    });
    expect(parsed.success).toBe(false);
  });
});
