import { describe, expect, test } from "vitest";
import {
  COLLECTION_DEFINITIONS,
  MIN_INDEXABLE_COLLECTION_SIZE,
  assertCollectionDefinitions,
  collectionMapPath,
  getCollectionDefinition,
  relatedCollections,
  resolveCollection,
  resolveCollectionBySlug,
  type CollectionDefinition,
  validateCollectionDefinitions,
} from "@/lib/playground-collections";

describe("playground collection registry", () => {
  test("contains exactly the 19 launch collections", () => {
    expect(COLLECTION_DEFINITIONS).toHaveLength(19);
    expect(new Set(COLLECTION_DEFINITIONS.map((item) => item.slug)).size).toBe(
      19,
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
      "chiayi-county",
      "tainan",
      "kaohsiung",
      "new-taipei-free",
      "taoyuan-free",
      "hsinchu-city-free",
      "hsinchu-county-free",
      "taichung-free",
    ]);
    expect(COLLECTION_DEFINITIONS.every((item) => item.family !== "city" || item.filter.city)).toBe(
      true,
    );
  });

  test("uses explicit ambiguous city mappings", () => {
    expect(getCollectionDefinition("hsinchu-city")?.city).toBe("新竹市");
    expect(getCollectionDefinition("hsinchu-county")?.city).toBe("新竹縣");
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
      matchingCount: 9,
      activeCount: 8,
      districtCount: 3,
      typeCount: 4,
    });
    expect(resolved?.places.some((place) => place.id === "ty-puhsin")).toBe(
      false,
    );
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

  test("does not create the rainy-day duplicate family", () => {
    expect(getCollectionDefinition("chiayi-county-rainy-day")).toBeUndefined();
  });
});

describe("related collections", () => {
  test("links only to valid city and variant collections", () => {
    const taoyuan = getCollectionDefinition("taoyuan")!;
    const taoyuanFree = getCollectionDefinition("taoyuan-free")!;
    const chiayiCounty = getCollectionDefinition("chiayi-county")!;

    expect(relatedCollections(taoyuan).map((item) => item.slug)).toEqual([
      "taoyuan-free",
    ]);
    expect(relatedCollections(taoyuanFree).map((item) => item.slug)).toEqual([
      "taoyuan",
    ]);
    expect(relatedCollections(chiayiCounty)).toEqual([]);
  });
});
