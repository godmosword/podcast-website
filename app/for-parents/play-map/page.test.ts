import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const PAGE = join(process.cwd(), "app/for-parents/play-map/page.tsx");
const CLIENT = join(
  process.cwd(),
  "components/for-parents/PlayMapClient.tsx",
);

describe("play-map static shell", () => {
  it("page.tsx 不讀 searchParams／cookies／headers，改掛 client island", () => {
    const source = readFileSync(PAGE, "utf8");
    expect(source).not.toMatch(/\bsearchParams\b/);
    expect(source).not.toMatch(/\bcookies\s*\(/);
    expect(source).not.toMatch(/\bheaders\s*\(/);
    expect(source).not.toMatch(/\bconnection\s*\(/);
    expect(source).not.toMatch(/async function PlayMapPage/);
    expect(source).toMatch(/PlayMapClient/);
    expect(source).toMatch(/PlayMapFallback/);
    expect(source).toMatch(/<Suspense\b/);
    expect(source).toContain("playgroundItemListJsonLd");
  });

  it("PlayMapClient 是唯一讀 URL 的 client island", () => {
    const source = readFileSync(CLIENT, "utf8");
    expect(source).toMatch(/["']use client["']/);
    expect(source).toMatch(/useSearchParams/);
    expect(source).toMatch(/parsePlayMapQuery/);
    expect(source).not.toMatch(/from\s+["']zod["']/);
  });
});
