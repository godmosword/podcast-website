import { describe, expect, test } from "vitest";
import {
  COLLECTION_DEFINITIONS,
  MIN_INDEXABLE_COLLECTION_SIZE,
  assertCollectionDefinitions,
  collectionMapCtaLabel,
  collectionMapPath,
  collectionParentSummary,
  collectionDescription,
  getCollectionDefinition,
  isCollectionIndexable,
  listCollectionDefinitions,
  relatedCollections,
  resolveCollection,
  resolveCollectionBySlug,
  type CollectionDefinition,
  validateCollectionDefinitions,
} from "@/lib/playground-collections";

describe("playground collection registry", () => {
  test("contains exactly the 21 launch collections", () => {
    expect(COLLECTION_DEFINITIONS).toHaveLength(21);
    expect(new Set(COLLECTION_DEFINITIONS.map((item) => item.slug)).size).toBe(
      21,
    );
    expect(COLLECTION_DEFINITIONS.map((item) => item.slug)).toEqual([
      "keelung",
      "taipei",
      "new-taipei",
      "taoyuan",
      "hsinchu-city",
      "hsinchu-county",
      "miaoli",
      "taichung",
      "changhua",
      "nantou",
      "yunlin",
      "chiayi-city",
      "chiayi-county",
      "tainan",
      "kaohsiung",
      "new-taipei-free",
      "taoyuan-free",
      "hsinchu-city-free",
      "hsinchu-county-free",
      "taichung-free",
      "taoyuan-indoor",
    ]);
    expect(COLLECTION_DEFINITIONS.every((item) => item.family !== "city" || item.filter.city)).toBe(
      true,
    );
  });

  test("uses explicit ambiguous city mappings", () => {
    expect(getCollectionDefinition("hsinchu-city")?.city).toBe("新竹市");
    expect(getCollectionDefinition("hsinchu-county")?.city).toBe("新竹縣");
    expect(getCollectionDefinition("chiayi-city")?.city).toBe("嘉義市");
    expect(getCollectionDefinition("chiayi-county")?.city).toBe("嘉義縣");
  });

  test("passes the current active-size and duplicate guards", () => {
    expect(validateCollectionDefinitions()).toEqual([]);
    expect(() => assertCollectionDefinitions()).not.toThrow();
    expect(MIN_INDEXABLE_COLLECTION_SIZE).toBe(5);
  });

  test("fails validation when a below-threshold entry is added", () => {
    const taipeiIndoor = {
      slug: "taipei-indoor",
      city: "台北市",
      cityDisplayName: "台北",
      family: "indoor" as const,
      filter: { city: "台北市", indoorOnly: true },
      title: "台北室內親子景點",
      shortLabel: "台北室內",
    };

    expect(validateCollectionDefinitions([...COLLECTION_DEFINITIONS, taipeiIndoor])).toEqual(
      expect.arrayContaining([
        expect.stringContaining("taipei-indoor has 3 active places"),
      ]),
    );
  });

  test("rejects an exact variant-to-parent active place ID duplicate", () => {
    const changhuaFree: CollectionDefinition = {
      slug: "changhua-free",
      city: "彰化縣",
      cityDisplayName: "彰化縣",
      family: "free",
      filter: { city: "彰化縣", freeOnly: true },
      title: "彰化縣免費親子景點",
      shortLabel: "彰化縣免費",
    };

    expect(
      validateCollectionDefinitions([...COLLECTION_DEFINITIONS, changhuaFree]),
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "changhua-free has an identical active place ID set to parent city collection changhua",
        ),
      ]),
    );
  });

  test("rejects identical variant-to-variant active place ID sets", () => {
    const variantA: CollectionDefinition = {
      slug: "changhua-free-a",
      city: "彰化縣",
      cityDisplayName: "彰化縣",
      family: "free",
      filter: { city: "彰化縣", freeOnly: true },
      title: "彰化縣免費親子景點 A",
      shortLabel: "彰化縣免費 A",
    };
    const variantB: CollectionDefinition = {
      slug: "changhua-free-b",
      city: "彰化縣",
      cityDisplayName: "彰化縣",
      family: "free",
      filter: { city: "彰化縣", freeOnly: true },
      title: "彰化縣免費親子景點 B",
      shortLabel: "彰化縣免費 B",
    };

    expect(validateCollectionDefinitions([variantA, variantB])).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "changhua-free-b has an identical active place ID set to launch collection changhua-free-a",
        ),
      ]),
    );
  });
});

describe("resolved collection semantics", () => {
  test("excludes the closed Taoyuan record from active results", () => {
    const resolved = resolveCollectionBySlug("taoyuan");

    expect(resolved).toMatchObject({
      matchingCount: 10,
      activeCount: 9,
      freeCount: 6,
      indoorCount: 5,
      highEnergyCount: 5,
      districtCount: 5,
      typeCount: 4,
    });
    expect(resolved?.places.some((place) => place.id === "ty-puhsin")).toBe(
      false,
    );
  });

  test("launches taoyuan-indoor with five distinct indoor places", () => {
    const definition = getCollectionDefinition("taoyuan-indoor");
    const resolved = resolveCollectionBySlug("taoyuan-indoor");

    expect(definition).toMatchObject({
      slug: "taoyuan-indoor",
      city: "桃園市",
      cityDisplayName: "桃園",
      family: "indoor",
      filter: { city: "桃園市", indoorOnly: true },
      title: "桃園室內親子景點",
      shortLabel: "桃園室內",
    });
    expect(resolved).toMatchObject({
      matchingCount: 5,
      activeCount: 5,
      freeCount: 2,
      indoorCount: 5,
      districtCount: 4,
      typeCount: 3,
    });
    expect(resolved?.places.map((place) => place.id)).toEqual([
      "ty-kids-museum",
      "ty-casti",
      "ty-xpark",
      "ty-shayangye-robot",
      "ty-disaster-education",
    ]);
    expect(collectionDescription(resolved!)).toBe(
      "目前收錄 5 個桃園室內親子景點，涵蓋 4 個行政區、3 種景點類型。",
    );
    expect(isCollectionIndexable(resolved!)).toBe(true);
    expect(getCollectionDefinition("taoyuan-rainy-day")).toBeUndefined();
  });

  test("keeps the removed indoor filter semantics available to Play Map", () => {
    const indoorDefinition: CollectionDefinition = {
      slug: "chiayi-county-indoor",
      city: "嘉義縣",
      cityDisplayName: "嘉義縣",
      family: "indoor",
      filter: { city: "嘉義縣", indoorOnly: true },
      title: "嘉義縣室內親子景點",
      shortLabel: "嘉義縣室內",
    };
    const resolved = resolveCollection(indoorDefinition);

    expect(resolved).toMatchObject({
      matchingCount: 5,
      activeCount: 5,
      districtCount: 4,
      typeCount: 2,
    });
    expect(resolved?.places.every((place) => place.indoor)).toBe(true);
    expect(resolveCollectionBySlug("chiayi-county-indoor")).toBeUndefined();
  });

  test("builds map links through the existing query builder semantics", () => {
    expect(collectionMapPath(getCollectionDefinition("taoyuan")!)).toBe(
      "/for-parents/play-map?city=%E6%A1%83%E5%9C%92%E5%B8%82&view=map",
    );
    expect(collectionMapPath(getCollectionDefinition("taoyuan-free")!)).toBe(
      "/for-parents/play-map?city=%E6%A1%83%E5%9C%92%E5%B8%82&free=1&view=map",
    );
    expect(collectionMapPath(getCollectionDefinition("taoyuan-indoor")!)).toBe(
      "/for-parents/play-map?city=%E6%A1%83%E5%9C%92%E5%B8%82&indoor=1&view=map",
    );

    const changhuaFree: CollectionDefinition = {
      slug: "changhua-free",
      city: "彰化縣",
      cityDisplayName: "彰化縣",
      family: "free",
      filter: { city: "彰化縣", freeOnly: true },
      title: "彰化縣免費親子景點",
      shortLabel: "彰化縣免費",
    };
    const chiayiIndoor: CollectionDefinition = {
      slug: "chiayi-county-indoor",
      city: "嘉義縣",
      cityDisplayName: "嘉義縣",
      family: "indoor",
      filter: { city: "嘉義縣", indoorOnly: true },
      title: "嘉義縣室內親子景點",
      shortLabel: "嘉義縣室內",
    };

    expect(collectionMapPath(changhuaFree)).toBe(
      "/for-parents/play-map?city=%E5%BD%B0%E5%8C%96%E7%B8%A3&free=1&view=map",
    );
    expect(collectionMapPath(chiayiIndoor)).toBe(
      "/for-parents/play-map?city=%E5%98%89%E7%BE%A9%E7%B8%A3&indoor=1&view=map",
    );
  });

  test("builds contextual map CTA labels without changing query semantics", () => {
    expect(collectionMapCtaLabel(getCollectionDefinition("taoyuan")!)).toBe(
      "在地圖上看桃園景點",
    );
    expect(
      collectionMapCtaLabel(getCollectionDefinition("taoyuan-free")!),
    ).toBe("在地圖上看桃園免費景點");
    expect(
      collectionMapCtaLabel(getCollectionDefinition("taoyuan-indoor")!),
    ).toBe("在地圖上看桃園室內景點");
  });

  test("computes parent relationship summaries from resolved data", () => {
    expect(
      collectionParentSummary(resolveCollectionBySlug("taoyuan-free")!),
    ).toBe("桃園目前 9 個親子景點中，有 6 個不用門票。");
    expect(
      collectionParentSummary(resolveCollectionBySlug("hsinchu-city-free")!),
    ).toBe(
      "新竹目前 8 個親子景點中，有 6 個不用門票。目前這 6 個免費選擇都是戶外景點。",
    );
    expect(
      collectionParentSummary(resolveCollectionBySlug("taoyuan-indoor")!),
    ).toBe("桃園目前 9 個親子景點中，有 5 個室內選擇。");
  });

  test("does not create the rainy-day duplicate family", () => {
    expect(getCollectionDefinition("chiayi-county-rainy-day")).toBeUndefined();
    expect(getCollectionDefinition("chiayi-city-rainy-day")).toBeUndefined();
  });

  test("launches chiayi-city as a city collection distinct from the county", () => {
    const definition = getCollectionDefinition("chiayi-city");
    expect(definition).toMatchObject({
      slug: "chiayi-city",
      city: "嘉義市",
      cityDisplayName: "嘉義市",
      family: "city",
      filter: { city: "嘉義市" },
      title: "嘉義市親子景點",
      shortLabel: "嘉義市",
    });
    expect(getCollectionDefinition("chiayi-city-indoor")).toBeUndefined();
    expect(getCollectionDefinition("chiayi-city-free")).toBeUndefined();
    expect(getCollectionDefinition("chiayi-city-rainy-day")).toBeUndefined();

    const resolved = resolveCollectionBySlug("chiayi-city");
    expect(resolved).toMatchObject({
      matchingCount: 5,
      activeCount: 5,
      freeCount: 2,
      indoorCount: 4,
      districtCount: 2,
      typeCount: 3,
    });
    expect(resolved && isCollectionIndexable(resolved)).toBe(true);
    expect(resolved?.places.map((place) => place.id)).toEqual([
      "cyc-chiayi-park",
      "cyc-city-museum",
      "cyc-art-museum",
      "cyc-shellginger",
      "cyc-tile-museum",
    ]);
    expect(resolved?.places.some((place) => place.city === "嘉義縣")).toBe(
      false,
    );
    expect(collectionDescription(resolved!)).toBe(
      "目前收錄 5 個嘉義市親子景點，涵蓋 2 個行政區、3 種景點類型。",
    );
    expect(collectionParentSummary(resolved!)).toBeNull();

    const indoorDefinition: CollectionDefinition = {
      slug: "chiayi-city-indoor",
      city: "嘉義市",
      cityDisplayName: "嘉義市",
      family: "indoor",
      filter: { city: "嘉義市", indoorOnly: true },
      title: "嘉義市室內親子景點",
      shortLabel: "嘉義市室內",
    };
    expect(resolveCollection(indoorDefinition).activeCount).toBe(4);

    expect(collectionMapPath(definition!)).toBe(
      "/for-parents/play-map?city=%E5%98%89%E7%BE%A9%E5%B8%82&view=map",
    );
    expect(collectionMapCtaLabel(definition!)).toBe("在地圖上看嘉義市景點");
    expect(
      collectionMapPath(getCollectionDefinition("chiayi-county")!),
    ).toBe("/for-parents/play-map?city=%E5%98%89%E7%BE%A9%E7%B8%A3&view=map");
  });
});

describe("related collections", () => {
  test("links only to valid city and variant collections", () => {
    const taoyuan = getCollectionDefinition("taoyuan")!;
    const taoyuanFree = getCollectionDefinition("taoyuan-free")!;
    const taoyuanIndoor = getCollectionDefinition("taoyuan-indoor")!;
    const chiayiCounty = getCollectionDefinition("chiayi-county")!;
    const chiayiCity = getCollectionDefinition("chiayi-city")!;

    expect(relatedCollections(taoyuan).map((item) => item.slug)).toEqual([
      "taoyuan-free",
      "taoyuan-indoor",
    ]);
    expect(relatedCollections(taoyuanFree).map((item) => item.slug)).toEqual([
      "taoyuan",
      "taoyuan-indoor",
    ]);
    expect(relatedCollections(taoyuanIndoor).map((item) => item.slug)).toEqual([
      "taoyuan",
      "taoyuan-free",
    ]);
    expect(relatedCollections(chiayiCounty)).toEqual([]);
    expect(relatedCollections(chiayiCity)).toEqual([]);
  });

  test("static params come from the 21 launch definitions", () => {
    expect(listCollectionDefinitions()).toHaveLength(21);
    expect(
      listCollectionDefinitions("city").map((item) => item.slug),
    ).toEqual([
      "keelung",
      "taipei",
      "new-taipei",
      "taoyuan",
      "hsinchu-city",
      "hsinchu-county",
      "miaoli",
      "taichung",
      "changhua",
      "nantou",
      "yunlin",
      "chiayi-city",
      "chiayi-county",
      "tainan",
      "kaohsiung",
    ]);
    expect(listCollectionDefinitions("indoor").map((item) => item.slug)).toEqual([
      "taoyuan-indoor",
    ]);
  });
});
