import { describe, expect, it } from "vitest";
import nextConfig from "../next.config";
import { retiredPageRedirects } from "./retired-page-redirects";

describe("retiredPageRedirects", () => {
  it("親子指南併進關於頁：/for-parents 永久轉到 /about，子頁不受影響", () => {
    expect(retiredPageRedirects()).toEqual([
      { source: "/for-parents", destination: "/about", permanent: true },
    ]);
  });

  it("next.config 有掛上這組轉址", async () => {
    const redirects = await nextConfig.redirects?.();
    expect(redirects).toEqual(
      expect.arrayContaining([
        { source: "/for-parents", destination: "/about", permanent: true },
      ]),
    );
  });
});
