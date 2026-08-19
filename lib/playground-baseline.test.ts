import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { getStory } from "@/data/content";
import {
  listCities,
  listPlaygrounds,
  PLAYGROUND_TYPES,
} from "@/data/playgrounds";
import {
  COLLECTION_DEFINITIONS,
  MIN_COLLECTION_DEFINITION_COUNT,
  MIN_INDEXABLE_COLLECTION_SIZE,
  validateCollectionDefinitions,
} from "@/lib/playground-collections";
import {
  CANDIDATE_FAMILIES,
  computePlaygroundBaseline,
  FACILITY_LIST_TAIL_PATTERN,
  HIGH_INTENT_CANDIDATE_SLUGS,
  PLAYGROUND_CITY_SLUGS,
  PLAYGROUND_STATUS_SEMANTICS,
} from "@/lib/playground-baseline";

const EDITORIAL_DOC = readFileSync(
  new URL("../docs/PLAY-MAP-EDITORIAL.md", import.meta.url),
  "utf8",
);
const BASELINE_DOC = readFileSync(
  new URL("../docs/PLAYGROUND-BASELINE.md", import.meta.url),
  "utf8",
);

describe("playground status semantics", () => {
  test("schema 沒有 open/closed，只有省略或 temporarily-closed", () => {
    expect(PLAYGROUND_STATUS_SEMANTICS.operatingMeans).toBe(
      "status field omitted",
    );
    expect(PLAYGROUND_STATUS_SEMANTICS.closedValue).toBe("temporarily-closed");
    expect(PLAYGROUND_STATUS_SEMANTICS.hasOpenClosedEnum).toBe(false);

    for (const place of listPlaygrounds()) {
      expect(
        place.status === undefined || place.status === "temporarily-closed",
        place.id,
      ).toBe(true);
    }
  });
});

describe("playground baseline invariants", () => {
  const baseline = computePlaygroundBaseline();

  test("global operating + temporarilyClosed === total", () => {
    const { global } = baseline;
    expect(global.operating + global.temporarilyClosed).toBe(global.total);
    expect(global.total).toBe(listPlaygrounds().length);
  });

  test("global free + paid === operating", () => {
    expect(baseline.global.free + baseline.global.paid).toBe(
      baseline.global.operating,
    );
  });

  test("global indoor + outdoor === operating", () => {
    expect(baseline.global.indoor + baseline.global.outdoor).toBe(
      baseline.global.operating,
    );
  });

  test("per-city totals reconcile to global", () => {
    const sum = (key: "total" | "operating" | "freeActive" | "indoorActive") =>
      baseline.cities.reduce((acc, row) => acc + row[key], 0);

    expect(sum("total")).toBe(baseline.global.total);
    expect(sum("operating")).toBe(baseline.global.operating);
    expect(sum("freeActive")).toBe(baseline.global.free);
    expect(sum("indoorActive")).toBe(baseline.global.indoor);
    expect(baseline.invariantIssues).toEqual([]);
  });

  test("per-city rows cover every city in listCities() once", () => {
    expect(baseline.cities.map((row) => row.city)).toEqual(listCities());
    expect(baseline.global.cities).toBe(listCities().length);
  });

  test("type distribution covers every playground once", () => {
    const typedTotal = PLAYGROUND_TYPES.reduce(
      (sum, type) => sum + (baseline.global.typeDistribution[type] ?? 0),
      0,
    );
    expect(typedTotal).toBe(baseline.global.total);
  });
});

describe("launch collection registry", () => {
  const baseline = computePlaygroundBaseline();

  test("production registry is COLLECTION_DEFINITIONS, not an old PLAY_MAP_COLLECTIONS file", () => {
    expect(baseline.launchRegistry.total).toBe(COLLECTION_DEFINITIONS.length);
    expect(baseline.launchRegistry.total).toBe(MIN_COLLECTION_DEFINITION_COUNT);
    expect(baseline.launchRegistry.cityCount).toBe(14);
    expect(baseline.launchRegistry.freeCount).toBe(5);
    expect(baseline.launchRegistry.indoorCount).toBe(0);
    expect(baseline.launchRegistry.otherFamilyCount).toBe(0);
    expect(baseline.launchRegistry.slugs).toEqual(
      COLLECTION_DEFINITIONS.map((item) => item.slug),
    );
  });

  test("keelung is a launched city collection; chiayi-city is not in the registry", () => {
    expect(baseline.launchRegistry.citySlugs).toContain("keelung");
    expect(baseline.launchRegistry.citySlugs).not.toContain("chiayi-city");
    expect(baseline.launchRegistry.unlaunchedCitySlugs).toEqual(["chiayi-city"]);
  });

  test("threshold contract uses active count >= 5 and excludes temporarily-closed", () => {
    expect(MIN_INDEXABLE_COLLECTION_SIZE).toBe(5);
    expect(baseline.threshold.minimumActiveCount).toBe(5);
    expect(baseline.threshold.usesActiveCount).toBe(true);
    expect(baseline.threshold.excludesTemporarilyClosed).toBe(true);
    expect(validateCollectionDefinitions()).toEqual([]);
  });

  test("launched collections have no exact duplicate active ID sets", () => {
    expect(baseline.launchedExactDuplicates).toEqual([]);
  });
});

describe("resolved contradictions", () => {
  const baseline = computePlaygroundBaseline();

  test("A/B: 15 cities vs 14 launched city collections; 基隆已上線、嘉義市未上線", () => {
    expect(baseline.global.cities).toBe(15);
    expect(baseline.launchRegistry.cityCount).toBe(14);
    const keelung = baseline.cities.find((row) => row.city === "基隆市");
    const chiayiCity = baseline.cities.find((row) => row.city === "嘉義市");
    expect(keelung?.operating).toBeGreaterThanOrEqual(5);
    expect(chiayiCity?.operating).toBeLessThan(5);
    expect(
      baseline.candidates.find((row) => row.slug === "keelung")?.currentlyLaunched,
    ).toBe(true);
    expect(
      baseline.candidates.find((row) => row.slug === "chiayi-city")
        ?.currentlyLaunched,
    ).toBe(false);
  });

  test("C: 嘉義市 4 筆全室內；嘉義縣 5 筆也全室內，indoor 會跟 city 重複", () => {
    const chiayiCity = baseline.cities.find((row) => row.city === "嘉義市");
    const chiayiCounty = baseline.cities.find((row) => row.city === "嘉義縣");
    expect(chiayiCity).toMatchObject({
      city: "嘉義市",
      total: 4,
      operating: 4,
      indoorActive: 4,
      outdoorActive: 0,
    });
    expect(chiayiCounty).toMatchObject({
      city: "嘉義縣",
      total: 5,
      operating: 5,
      indoorActive: 5,
      outdoorActive: 0,
    });
    expect(
      baseline.candidates.find((row) => row.slug === "chiayi-county-indoor"),
    ).toMatchObject({
      activeCount: 5,
      currentlyLaunched: false,
      exactDuplicateOfParent: true,
    });
  });

  test("locks the current global census so later agents do not guess", () => {
    expect(baseline.global).toEqual({
      total: 96,
      operating: 95,
      temporarilyClosed: 1,
      cities: 15,
      districts: 66,
      typeDistribution: {
        公園: 41,
        室內樂園: 1,
        主題樂園: 7,
        博物館: 29,
        動物園: 4,
        農場: 4,
        其他: 10,
      },
      free: 55,
      paid: 40,
      indoor: 32,
      outdoor: 63,
    });
    expect(
      baseline.cities.map((row) => [
        row.city,
        row.total,
        row.operating,
        row.freeActive,
        row.indoorActive,
      ]),
    ).toEqual([
      ["基隆市", 5, 5, 3, 1],
      ["台北市", 8, 8, 3, 3],
      ["新北市", 8, 8, 5, 3],
      ["桃園市", 9, 8, 5, 4],
      ["新竹市", 8, 8, 6, 1],
      ["新竹縣", 8, 8, 5, 1],
      ["苗栗縣", 5, 5, 3, 0],
      ["台中市", 8, 8, 6, 1],
      ["彰化縣", 5, 5, 5, 0],
      ["南投縣", 5, 5, 2, 2],
      ["雲林縣", 5, 5, 3, 1],
      ["嘉義市", 4, 4, 1, 4],
      ["嘉義縣", 5, 5, 2, 5],
      ["台南市", 7, 7, 2, 3],
      ["高雄市", 6, 6, 4, 3],
    ]);
  });

  test("D: global indoor equals sum of city indoorActive", () => {
    const cityIndoor = baseline.cities.reduce(
      (sum, row) => sum + row.indoorActive,
      0,
    );
    const cityFree = baseline.cities.reduce(
      (sum, row) => sum + row.freeActive,
      0,
    );
    expect(cityIndoor).toBe(baseline.global.indoor);
    expect(cityFree).toBe(baseline.global.free);
  });
});

describe("collection candidates and near-threshold", () => {
  const baseline = computePlaygroundBaseline();

  test("emits city/free/indoor/rainy-day candidates for every city without adding routes", () => {
    expect(CANDIDATE_FAMILIES).toEqual(["city", "free", "indoor", "rainy-day"]);
    expect(baseline.candidates).toHaveLength(listCities().length * 4);
    expect(
      baseline.candidates.every((row) =>
        CANDIDATE_FAMILIES.includes(row.family),
      ),
    ).toBe(true);
    expect(
      baseline.candidates.filter((row) => row.currentlyLaunched),
    ).toHaveLength(COLLECTION_DEFINITIONS.length);
  });

  test("city slug map covers every recorded city and matches launched city collections", () => {
    for (const city of listCities()) {
      expect(PLAYGROUND_CITY_SLUGS[city], city).toBeTypeOf("string");
    }
    for (const definition of COLLECTION_DEFINITIONS) {
      if (definition.family !== "city") continue;
      expect(PLAYGROUND_CITY_SLUGS[definition.city]).toBe(definition.slug);
    }
  });

  test("high-intent candidates are present with current active counts", () => {
    const bySlug = new Map(baseline.candidates.map((row) => [row.slug, row]));
    for (const slug of HIGH_INTENT_CANDIDATE_SLUGS) {
      expect(bySlug.has(slug), slug).toBe(true);
      const row = baseline.nearThreshold.find((item) => item.slug === slug);
      expect(row, slug).toBeDefined();
      expect(row?.currentActive).toBe(bySlug.get(slug)?.activeCount);
      expect(row?.shortOf5).toBe(Math.max(0, 5 - (row?.currentActive ?? 0)));
    }
    expect(
      baseline.nearThreshold
        .filter((row) => row.highIntent)
        .map((row) => [row.slug, row.currentActive, row.shortOf5, row.exactDuplicate]),
    ).toEqual([
      ["taoyuan-indoor", 4, 1, false],
      ["kaohsiung-free", 4, 1, false],
      ["chiayi-city", 4, 1, false],
      ["taipei-free", 3, 2, false],
      ["taipei-indoor", 3, 2, false],
      ["new-taipei-indoor", 3, 2, false],
      ["tainan-indoor", 3, 2, false],
      ["kaohsiung-indoor", 3, 2, false],
    ]);
  });

  test("hypothetical changhua-free and chiayi-county-indoor are exact parent duplicates", () => {
    expect(baseline.candidateExactDuplicates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          slugA: "changhua",
          slugB: "changhua-free",
        }),
        expect.objectContaining({
          slugA: "chiayi-county",
          slugB: "chiayi-county-indoor",
        }),
      ]),
    );
  });
});

describe("optional fields, tips, relatedEpisodes", () => {
  const baseline = computePlaygroundBaseline();

  test("does not treat every null optional field as quality debt", () => {
    expect(baseline.optionalFields.placeId).toMatchObject({
      present: 0,
      missing: 96,
      required: false,
    });
    expect(baseline.optionalFields.mapsQuery.required).toBe(false);
    expect(baseline.optionalFields.relatedEpisodes.required).toBe(false);
    expect(baseline.optionalFields.officialUrl.missingLikelyDebt).toBe(0);
    expect(baseline.optionalFields.feeNote.missingLikelyDebt).toBe(0);
    expect(baseline.paidFeeClarity).toMatchObject({
      activePaid: 40,
      paidWithFeeNote: 40,
      paidWithoutFeeNote: 0,
      paidWithOfficialUrl: 40,
      paidWithoutOfficialUrl: 0,
      paidWithoutFeeNoteIds: [],
    });
  });

  test("tips facility-list tail uses the shared pattern", () => {
    expect(FACILITY_LIST_TAIL_PATTERN.test("場內有溜滑梯、鞦韆。")).toBe(true);
    expect(baseline.tipsDebt.count).toBe(14);
    expect(baseline.tipsDebt.placeIds).toHaveLength(14);
    // A2–A4 都是增量試點，不得一次清掉全部尾句債
    expect(baseline.tipsDebt.count).toBeGreaterThan(0);
    expect(baseline.tipsDebt.count).toBeLessThan(26);
  });

  test("relatedEpisodes is an optional story-slug array and currently empty", () => {
    expect(baseline.relatedEpisodes.recordsWithLinks).toBe(0);
    expect(baseline.relatedEpisodes.totalLinks).toBe(0);
    expect(baseline.relatedEpisodes.missingStorySlugs).toEqual([]);
    expect(getStory("ep-23")?.slug).toBe("ep-23");
  });
});

describe("documentation drift guards", () => {
  test("editorial doc does not keep the retired 16/73 indoor census", () => {
    expect(EDITORIAL_DOC).not.toContain("16／73");
    expect(EDITORIAL_DOC).not.toContain("共 73 處");
    expect(EDITORIAL_DOC).toContain("playground-baseline.ts");
  });

  test("baseline doc cites the locked census", () => {
    expect(BASELINE_DOC).toContain("| total | 96 |");
    expect(BASELINE_DOC).toContain("| operating | 95 |");
    expect(BASELINE_DOC).toContain("TOTAL = 19");
    expect(BASELINE_DOC).toContain("未 launch 的 city candidate 只有 **嘉義市**");
  });
});
