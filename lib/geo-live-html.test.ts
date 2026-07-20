import { describe, expect, it } from "vitest";
import {
  contentTypeMatches,
  extractCanonicalHref,
  isLikelyEdgeOrWafErrorPage,
  parseJsonLdBlocks,
} from "./geo-live-html";

describe("geo-live-html", () => {
  it("偵測 Vercel 部署不存在頁", () => {
    expect(
      isLikelyEdgeOrWafErrorPage("DEPLOYMENT_NOT_FOUND", "text/html; charset=utf-8"),
    ).toBe(true);
    expect(isLikelyEdgeOrWafErrorPage("<html><body>正常首頁</body></html>", "text/html")).toBe(
      false,
    );
  });

  it("解析 JSON-LD", () => {
    const html = `<script type="application/ld+json">{"@type":"WebSite","name":"test"}</script>`;
    const blocks = parseJsonLdBlocks(html);
    expect(blocks).toHaveLength(1);
  });

  it("extractCanonicalHref", () => {
    const html = `<link rel="canonical" href="https://example.com/story/ep-1" />`;
    expect(extractCanonicalHref(html)).toBe("https://example.com/story/ep-1");
  });

  it("contentTypeMatches", () => {
    expect(contentTypeMatches(/^text\/plain$/i, "text/plain; charset=utf-8")).toBe(true);
    expect(contentTypeMatches(/^application\/xml$/i, "text/html")).toBe(false);
  });
});
