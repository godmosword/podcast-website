import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getStories } from "@/data/content";
import { listPlaygrounds } from "@/data/playgrounds";
import {
  VISUAL_FIXTURE_ANCHOR_PLACE_ID,
  VISUAL_FIXTURE_PLAYGROUND_LIMIT,
  VISUAL_FIXTURE_STORY_SLUGS,
  applyCharacterFixture,
  applyPlaygroundFixture,
  applyStoryFixture,
  isVisualFixtureEnabled,
  parseVisualPlayerState,
  visualPlayerStateFromSearch,
} from "./visual-fixture";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isVisualFixtureEnabled", () => {
  it("預設關閉", () => {
    vi.stubEnv("VISUAL_FIXTURE", "");
    vi.stubEnv("NEXT_PUBLIC_VISUAL_FIXTURE", "");
    vi.stubEnv("VERCEL", "");
    expect(isVisualFixtureEnabled()).toBe(false);
  });

  it("VISUAL_FIXTURE=1 開啟", () => {
    vi.stubEnv("VISUAL_FIXTURE", "1");
    vi.stubEnv("NEXT_PUBLIC_VISUAL_FIXTURE", "");
    vi.stubEnv("VERCEL", "");
    expect(isVisualFixtureEnabled()).toBe(true);
  });

  it("NEXT_PUBLIC_VISUAL_FIXTURE=1 開啟（client bundle 靠這個）", () => {
    vi.stubEnv("VISUAL_FIXTURE", "");
    vi.stubEnv("NEXT_PUBLIC_VISUAL_FIXTURE", "1");
    vi.stubEnv("VERCEL", "");
    expect(isVisualFixtureEnabled()).toBe(true);
  });

  it("Vercel 上啟用立刻失敗", () => {
    vi.stubEnv("VISUAL_FIXTURE", "1");
    vi.stubEnv("VERCEL", "1");
    expect(() => isVisualFixtureEnabled()).toThrow(/禁止在 Vercel/);
  });
});

describe("applyStoryFixture", () => {
  const catalog = [
    { slug: "ep-1", ep: 1 },
    { slug: "ep-6", ep: 6 },
    { slug: "ep-23", ep: 23 },
  ];

  it("關閉時回傳同一參考（不複製）", () => {
    vi.stubEnv("VISUAL_FIXTURE", "");
    vi.stubEnv("NEXT_PUBLIC_VISUAL_FIXTURE", "");
    expect(applyStoryFixture(catalog)).toBe(catalog);
  });

  it("開啟時只留 EP1–6", () => {
    vi.stubEnv("VISUAL_FIXTURE", "1");
    vi.stubEnv("VERCEL", "");
    expect(applyStoryFixture(catalog).map((item) => item.slug)).toEqual([
      "ep-1",
      "ep-6",
    ]);
  });
});

describe("applyPlaygroundFixture", () => {
  it("前 12 筆已含錨點景點時原樣切片", () => {
    vi.stubEnv("VISUAL_FIXTURE", "1");
    vi.stubEnv("VERCEL", "");
    const places = Array.from({ length: 20 }, (_, i) => ({
      id: i === 3 ? VISUAL_FIXTURE_ANCHOR_PLACE_ID : `place-${i}`,
    }));
    const next = applyPlaygroundFixture(places);
    expect(next).toHaveLength(VISUAL_FIXTURE_PLAYGROUND_LIMIT);
    expect(next.some((place) => place.id === VISUAL_FIXTURE_ANCHOR_PLACE_ID)).toBe(
      true,
    );
  });

  it("前 12 筆沒有錨點時補上 ty-kids-museum", () => {
    vi.stubEnv("VISUAL_FIXTURE", "1");
    vi.stubEnv("VERCEL", "");
    const places = [
      ...Array.from({ length: 15 }, (_, i) => ({ id: `place-${i}` })),
      { id: VISUAL_FIXTURE_ANCHOR_PLACE_ID },
    ];
    const next = applyPlaygroundFixture(places);
    expect(next).toHaveLength(VISUAL_FIXTURE_PLAYGROUND_LIMIT);
    expect(next.at(-1)?.id).toBe(VISUAL_FIXTURE_ANCHOR_PLACE_ID);
  });
});

describe("applyCharacterFixture", () => {
  it("開啟時裁掉凍結集以外的登場、並丟掉沒剩登場的角色", () => {
    vi.stubEnv("VISUAL_FIXTURE", "1");
    vi.stubEnv("VERCEL", "");
    const next = applyCharacterFixture([
      { id: "a", appearsIn: ["ep-1", "ep-23"] },
      { id: "b", appearsIn: ["ep-23"] },
    ]);
    expect(next).toEqual([{ id: "a", appearsIn: ["ep-1"] }]);
  });
});

describe("parseVisualPlayerState / visualPlayerStateFromSearch", () => {
  it("只接受四態", () => {
    expect(parseVisualPlayerState("ended")).toBe("ended");
    expect(parseVisualPlayerState("nope")).toBeUndefined();
    expect(parseVisualPlayerState(undefined)).toBeUndefined();
  });

  it("正式站忽略 ?vp=", () => {
    vi.stubEnv("VISUAL_FIXTURE", "");
    vi.stubEnv("NEXT_PUBLIC_VISUAL_FIXTURE", "");
    expect(visualPlayerStateFromSearch("?vp=ended")).toBeUndefined();
  });

  it("fixture build 才讀 ?vp=", () => {
    vi.stubEnv("VISUAL_FIXTURE", "1");
    vi.stubEnv("VERCEL", "");
    expect(visualPlayerStateFromSearch("?vp=manual-page")).toBe("manual-page");
    expect(visualPlayerStateFromSearch("vp=loading")).toBe("loading");
  });
});

describe("凍結 slug／景點仍在真實 catalog", () => {
  // 這組斷言讀真實 catalog，必須在 fixture 關閉時跑。
  it("EP1–6 都存在", () => {
    vi.stubEnv("VISUAL_FIXTURE", "");
    vi.stubEnv("NEXT_PUBLIC_VISUAL_FIXTURE", "");
    vi.stubEnv("VERCEL", "");
    const slugs = new Set(getStories().map((story) => story.slug));
    for (const slug of VISUAL_FIXTURE_STORY_SLUGS) {
      expect(slugs.has(slug), slug).toBe(true);
    }
  });

  it("錨點景點存在，且目前排序下前 12 筆已包含它", () => {
    vi.stubEnv("VISUAL_FIXTURE", "");
    vi.stubEnv("NEXT_PUBLIC_VISUAL_FIXTURE", "");
    vi.stubEnv("VERCEL", "");
    const places = listPlaygrounds();
    expect(places.some((place) => place.id === VISUAL_FIXTURE_ANCHOR_PLACE_ID)).toBe(
      true,
    );
    expect(
      places
        .slice(0, VISUAL_FIXTURE_PLAYGROUND_LIMIT)
        .some((place) => place.id === VISUAL_FIXTURE_ANCHOR_PLACE_ID),
    ).toBe(true);
  });
});

describe("trusted visual 指令契約", () => {
  it("test:visual:trusted 會帶 fixture 與 trusted gate，且 webServer 會轉入 NEXT_PUBLIC_VISUAL_FIXTURE", () => {
    const pkg = JSON.parse(
      readFileSync(join(process.cwd(), "package.json"), "utf8"),
    ) as { scripts?: Record<string, string> };
    const trusted = pkg.scripts?.["test:visual:trusted"] ?? "";
    expect(trusted).toContain("VISUAL_BASELINE_TRUSTED=1");
    expect(trusted).toContain("VISUAL_FIXTURE=1");
    expect(trusted).toContain("NEXT_PUBLIC_VISUAL_FIXTURE=1");

    const playwright = readFileSync(
      join(process.cwd(), "playwright.config.ts"),
      "utf8",
    );
    expect(playwright).toContain("NEXT_PUBLIC_VISUAL_FIXTURE");
    expect(playwright).toContain("VISUAL_FIXTURE");
  });
});
