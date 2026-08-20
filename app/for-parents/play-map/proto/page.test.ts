import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { metadata } from "@/app/for-parents/play-map/proto/page";
import sitemap from "@/app/sitemap";

const PROTO_PAGE = join(
  process.cwd(),
  "app/for-parents/play-map/proto/page.tsx",
);

describe("play-map proto route guards", () => {
  it("metadata 為 noindex、nofollow，且不設 canonical", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.alternates).toBeUndefined();
    expect(metadata.openGraph).toBeUndefined();
  });

  it("頁面不引入 JsonLd 或 playground ItemList", () => {
    const source = readFileSync(PROTO_PAGE, "utf8");
    expect(source).not.toMatch(/from ["']@\/components\/JsonLd["']/);
    expect(source).not.toContain("playgroundItemListJsonLd");
    expect(source).not.toContain("breadcrumbListJsonLd");
    expect(source).not.toContain("CITY_AGGREGATE_MAX_ZOOM");
  });

  it("variant 切換不得影響 metadata.robots", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("sitemap 白名單不含 proto", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const urls = sitemap().map((entry) => entry.url);

    expect(urls).not.toContain("https://example.com/for-parents/play-map/proto");
    expect(urls.some((url) => url.includes("/play-map/proto"))).toBe(false);

    vi.unstubAllEnvs();
  });
});
