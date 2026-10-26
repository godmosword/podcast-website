import { afterEach, describe, expect, it, vi } from "vitest";
import appleSynced from "@/data/apple-synced.json";
import { manualStories } from "@/data/stories";
import { VISUAL_FIXTURE_PLACE_IDS, VISUAL_FIXTURE_STORY_SLUGS } from "./visual-fixture";

/** 重新載入資料模組：旗標在模組載入時讀，換旗標要重載。 */
async function loadData(fixtureBuild: "1" | "0") {
  vi.resetModules();
  vi.stubEnv("VISUAL_FIXTURE_BUILD", fixtureBuild);
  vi.stubEnv("CI", "");
  vi.stubEnv("VERCEL", "");
  const content = await import("@/data/content");
  const playgrounds = await import("@/data/playgrounds");
  return { content, playgrounds };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("VISUAL_FIXTURE：視覺回歸專用的凍結資料（VIS-DEBT-2）", () => {
  it("沒開旗標：故事與景點都是全集（正式站不受影響）", async () => {
    const { content, playgrounds } = await loadData("0");
    expect(content.getStories()).toHaveLength(manualStories.length + appleSynced.length);
    expect(content.getStory("ep-35")).toBeDefined();
    expect(playgrounds.listPlaygrounds().length).toBeGreaterThan(VISUAL_FIXTURE_PLACE_IDS.length);
  });

  it("開了旗標：每一個查詢入口都只看得到固定的 6 集", async () => {
    const { content } = await loadData("1");
    const slugs = [...VISUAL_FIXTURE_STORY_SLUGS];
    expect(content.getStories().map((s) => s.slug).sort()).toEqual([...slugs].sort());
    expect(content.storiesByNewest().map((s) => s.slug)).toEqual(
      [...slugs].sort((a, b) => Number(b.slice(3)) - Number(a.slice(3))),
    );
    expect(content.getStory("ep-35")).toBeUndefined();
    for (const vehicle of content.allVehicles()) {
      for (const s of content.getStoriesByVehicle(vehicle)) expect(slugs).toContain(s.slug);
    }
    for (const tag of content.allTags()) {
      for (const s of content.getStoriesByTag(tag)) expect(slugs).toContain(s.slug);
    }
    for (const s of content.getRelated("ep-3", 10)) expect(slugs).toContain(s.slug);
    const next = content.getNextStory("ep-22");
    expect(next && slugs.includes(next.slug as (typeof slugs)[number])).toBe(true);
  });

  it("開了旗標：景點只剩固定的 12 個，縣市清單跟著收斂", async () => {
    const { playgrounds } = await loadData("1");
    const ids = playgrounds.listPlaygrounds().map((p) => p.id);
    expect([...ids].sort()).toEqual([...VISUAL_FIXTURE_PLACE_IDS].sort());
    expect(playgrounds.getPlayground("tp-ntsec")).toBeUndefined();
    expect(playgrounds.getPlayground("ty-kids-museum")).toBeDefined();
    const cities = new Set(playgrounds.listPlaygrounds().map((p) => p.city));
    expect(new Set(playgrounds.listCities())).toEqual(cities);
  });

  it.each([{ CI: "true" }, { VERCEL: "1" }])("凍結資料跑到 CI／Vercel 上直接丟錯（%o）", async (env) => {
    vi.resetModules();
    vi.stubEnv("VISUAL_FIXTURE_BUILD", "1");
    for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
    await expect(import("@/data/content")).rejects.toThrow(/VISUAL_FIXTURE_BUILD/);
  });

  it("固定清單涵蓋北中南與每一種景點類型；視覺測試錨定的 ep-1、ep-3、ty-kids-museum 都在", async () => {
    const { playgrounds } = await loadData("0");
    expect(VISUAL_FIXTURE_STORY_SLUGS).toHaveLength(6);
    expect(VISUAL_FIXTURE_PLACE_IDS).toHaveLength(12);
    expect(VISUAL_FIXTURE_STORY_SLUGS).toEqual(expect.arrayContaining(["ep-1", "ep-3"]));
    expect(VISUAL_FIXTURE_PLACE_IDS).toContain("ty-kids-museum");
    const places = VISUAL_FIXTURE_PLACE_IDS.map((id) => playgrounds.getPlayground(id)!);
    expect(new Set(places.map((p) => p.type))).toEqual(new Set(playgrounds.PLAYGROUND_TYPES));
    const cities = new Set(places.map((p) => p.city));
    for (const city of ["台北市", "台中市", "高雄市"]) expect(cities).toContain(city);
  });
});
