import { describe, expect, it } from "vitest";
import {
  buildGoogleMapsNavUrl,
  buildGoogleMapsPlaceUrl,
  getPlayground,
  listCities,
  listPlaygrounds,
  type Playground,
  type PlaygroundType,
} from "./playgrounds";
import {
  assertWave1CoverageMet,
  assertWave2CoverageMet,
} from "@/lib/playground-coverage";

const VALID_TYPES = new Set<PlaygroundType>([
  "公園",
  "室內樂園",
  "主題樂園",
  "博物館",
  "動物園",
  "農場",
  "其他",
]);

/** 由 PlayMap 元件統一渲染的固定提示；`tips` 不得重複（見 docs/PLAY-MAP-EDITORIAL.md）。 */
const UI_VOLATILITY_NOTICE = "票價與營業時間易變動，出發前請以官網為準。";

const VALID_SOURCE_KINDS = new Set(["official", "gov", "editorial"]);

const SOCIAL_DOMAIN_BLACKLIST = [
  "ptt.cc",
  "threads.net",
  "instagram.com",
  "facebook.com",
  "dcard.tw",
  // 商業旅遊入口不算官方來源（editorial 契約：官網／公部門開放資料／場館官方頁）
  "travelking.com.tw",
];

/**
 * 2026-08-11 全量連通性稽核抓到的失效網域（多為拼字錯誤或站台搬遷）。
 * 靜態測試無法驗證連通性（CI 不打外網），改以「不得再出現」擋住回歸。
 * 右側為當時查證到的正確網域。
 */
const RETIRED_DOMAINS: Record<string, string> = {
  "tmoca.tycg.gov.tw": "tmofa.tycg.gov.tw（桃園市立美術館）",
  "www.puhsin.com.tw": "www.pushin-ranch.com（埔心牧場）",
  "museum.taipei.gov.tw": "waterpark.water.gov.taipei（臺北自來水園區）",
  "zoo.hccg.gov.tw": "zoo-info.hccg.gov.tw（新竹市立動物園）",
  "tour.klcg.gov.tw": "travel.klcg.gov.tw（基隆旅遊網）",
};

const COMMERCIAL_TYPES = new Set<PlaygroundType>(["室內樂園", "主題樂園"]);

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
  const retiredHint = RETIRED_DOMAINS[parsed.hostname];
  expect(
    retiredHint,
    `${id} 使用了已失效網域 ${parsed.hostname}，請改用 ${retiredHint}`,
  ).toBeUndefined();
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

  // officialUrl 過去沒被驗證，2026-08-11 稽核時 4 個失效網域有 2 個就藏在這裡
  if (item.officialUrl !== undefined) {
    assertSourceUrl(item.officialUrl, `${item.id} officialUrl`);
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

  it("listCities 去重且依由北到南排序", () => {
    const cities = listCities();
    expect(cities.length).toBeGreaterThan(0);
    expect(cities).toEqual([...new Set(cities)]);
    for (const city of cities) {
      expect(listPlaygrounds().some((item) => item.city === city)).toBe(true);
    }

    // 北到南的相對順序（字典序會排成 台中→台北→南投→苗栗，對家長無意義）
    const order = (city: string) => cities.indexOf(city);
    expect(order("基隆市")).toBeLessThan(order("台北市"));
    expect(order("台北市")).toBeLessThan(order("桃園市"));
    expect(order("桃園市")).toBeLessThan(order("台中市"));
    expect(order("台中市")).toBeLessThan(order("雲林縣"));
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

  it("每個 PlaygroundType 至少一筆", () => {
    const types = new Set(listPlaygrounds().map((item) => item.type));
    for (const type of VALID_TYPES) {
      expect(types.has(type), `缺少 type: ${type}`).toBe(true);
    }
  });

  it("tips 不得重複 UI 固定票價提示", () => {
    for (const item of listPlaygrounds()) {
      expect(
        item.tips?.includes(UI_VOLATILITY_NOTICE) ?? false,
        `${item.id} 的 tips 重複了元件已渲染的固定提示`,
      ).toBe(false);
    }
  });

  it("需購票場館必有 officialUrl 或 official 來源", () => {
    for (const item of listPlaygrounds()) {
      if (item.free) continue;
      const hasOfficial =
        Boolean(item.officialUrl) ||
        item.sources.some((source) => source.kind === "official");
      expect(hasOfficial, `${item.id} 需購票但缺 official 來源`).toBe(true);
    }
  });

  it("feeNote 若存在則為非空字串", () => {
    for (const item of listPlaygrounds()) {
      if (item.feeNote === undefined) continue;
      expect(item.feeNote.trim().length, item.id).toBeGreaterThan(0);
    }
  });

  it("type 字串含「室內」⇒ indoor 為 true", () => {
    for (const item of listPlaygrounds()) {
      if (item.type.includes("室內")) {
        expect(item.indoor, item.id).toBe(true);
      }
    }
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
