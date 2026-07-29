import { describe, expect, it } from "vitest";
import { GET } from "./route";
import { buildAppleAppSiteAssociation } from "@/lib/ios-app-links";

describe("GET /.well-known/apple-app-site-association", () => {
  it("回 JSON 與 Content-Type application/json", async () => {
    const res = GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("application/json");
    await expect(res.json()).resolves.toEqual(buildAppleAppSiteAssociation());
  });
});
