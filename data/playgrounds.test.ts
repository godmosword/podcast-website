import { describe, expect, it } from "vitest";
import {
  buildGoogleMapsNavUrl,
  buildGoogleMapsPlaceUrl,
  getPlayground,
  listCities,
  listPlaygrounds,
  type Playground,
} from "./playgrounds";
import {
  assertWave1CoverageMet,
  assertWave2CoverageMet,
} from "@/lib/playground-coverage";

const VALID_TYPES = new Set([
  "公園",
  "室內樂園",
  "博物館",
  "農場",
  "室內放電",
  "其他",
]);

const VALID_SOURCE_KINDS = new Set(["official", "gov", "editorial"]);

const SOCIAL_DOMAIN_BLACKLIST = [
  "ptt.cc",
  "threads.net",
  "instagram.com",
  "facebook.com",
  "dcard.tw",
];

const COMMERCIAL_TYPES = new Set(["室內樂園"]);

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function assertSourceUrl(url: string, id: string): void {
  const parsed = new URL(url);
  expect(parsed.protocol, `${id} source url`).toBe("https:");
  for (const domain of SOCIAL_DOMAIN_BLACKLIST) {
    expect(parsed.hostname.includes(domain), `${id} ${url}`).toBe(false);
  }
}

function assertPlaygroundShape(item: Playground): void {
  expect(item.id.trim().length, item.id).toBeGreaterThan(0);
  expect(item.name.trim().length, item.id).toBeGreaterThan(0);
  expect(item.city.trim().length, item.id).toBeGreaterThan(0);
  expect(item.address.trim().length, item.id).toBeGreaterThan(0);
  expect(VALID_TYPES.has(item.type), item.id).toBe(true);
  expect(item.ageRange).toHaveLength(2);
  expect(item.ageRange[0], item.id).toBeLessThanOrEqual(item.ageRange[1]);
  expect(item.lat, item.id).toBeGreaterThan(21);
  expect(item.lat, item.id).toBeLessThan(27);
  expect(item.lng, item.id).toBeGreaterThan(119);
  expect(item.lng, item.id).toBeLessThan(123);
  expect(Array.isArray(item.facilities), item.id).toBe(true);
  expect(Array.isArray(item.tags), item.id).toBe(true);

  expect(item.sources.length, item.id).toBeGreaterThanOrEqual(1);
  for (const source of item.sources) {
    expect(VALID_SOURCE_KINDS.has(source.kind), item.id).toBe(true);
    expect(source.name.trim().length, item.id).toBeGreaterThan(0);
    assertSourceUrl(source.url, item.id);
  }

  expect(ISO_DATE_PATTERN.test(item.lastVerified), item.id).toBe(true);
  expect(Number.isNaN(parseIsoDate(item.lastVerified).getTime()), item.id).toBe(
    false,
  );

  if (COMMERCIAL_TYPES.has(item.type)) {
    const hasOfficial =
      Boolean(item.officialUrl) ||
      item.sources.some((source) => source.kind === "official");
    expect(hasOfficial, item.id).toBe(true);
  }
}

describe("playgrounds sidecar", () => {
  it("示範資料至少 3 筆且欄位完整", () => {
    const items = listPlaygrounds();
    expect(items.length).toBeGreaterThanOrEqual(3);
    for (const item of items) {
      assertPlaygroundShape(item);
    }
  });

  it("id 不重複", () => {
    const ids = listPlaygrounds().map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("getPlayground 可依 id 取得", () => {
    const first = listPlaygrounds()[0];
    expect(getPlayground(first.id)).toEqual(first);
    expect(getPlayground("does-not-exist")).toBeUndefined();
  });

  it("listCities 去重且排序", () => {
    const cities = listCities();
    expect(cities.length).toBeGreaterThan(0);
    expect(cities).toEqual([...new Set(cities)].sort((a, b) => a.localeCompare(b, "zh-Hant")));
    for (const city of cities) {
      expect(listPlaygrounds().some((item) => item.city === city)).toBe(true);
    }
  });

  it("Wave 1 北北基桃各縣市達覆蓋門檻", () => {
    const { ok, missing } = assertWave1CoverageMet();
    expect(missing, `未達門檻：${missing.join("、")}`).toEqual([]);
    expect(ok).toBe(true);
  });

  it("Wave 2 竹苗中彰投雲各縣市達覆蓋門檻", () => {
    const { ok, missing } = assertWave2CoverageMet();
    expect(missing, `未達門檻：${missing.join("、")}`).toEqual([]);
    expect(ok).toBe(true);
  });

  it("buildGoogleMapsNavUrl 為 dir 導航格式且不含 origin", () => {
    const url = buildGoogleMapsNavUrl(25.0018, 121.3056);
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(
      "https://www.google.com/maps/dir/",
    );
    expect(parsed.searchParams.get("api")).toBe("1");
    expect(parsed.searchParams.get("destination")).toBe("25.0018,121.3056");
    expect(parsed.searchParams.get("travelmode")).toBe("driving");
    expect(parsed.searchParams.get("dir_action")).toBe("navigate");
    expect(parsed.searchParams.has("origin")).toBe(false);
  });

  it("buildGoogleMapsPlaceUrl 為 search 定位格式", () => {
    const url = buildGoogleMapsPlaceUrl(25.0018, 121.3056);
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(
      "https://www.google.com/maps/search/",
    );
    expect(parsed.searchParams.get("api")).toBe("1");
    expect(parsed.searchParams.get("query")).toBe("25.0018,121.3056");
  });
});
