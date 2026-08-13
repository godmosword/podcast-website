import { describe, expect, it } from "vitest";
import {
  buildGoogleMapsNavUrl,
  buildGoogleMapsPlaceUrl,
  getPlayground,
  listCities,
  listPlaygrounds,
  playgroundMapsSearchQuery,
  playgroundSchema,
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

  it("每一筆通過 playgroundSchema（僅測試 safeParse，runtime 不丟例外）", () => {
    for (const item of listPlaygrounds()) {
      const parsed = playgroundSchema.safeParse(item);
      expect(
        parsed.success,
        parsed.success
          ? item.id
          : `${item.id}: ${JSON.stringify(parsed.error.issues)}`,
      ).toBe(true);
    }
  });

  it("playgroundSchema 拒絕非法 type", () => {
    const sample = listPlaygrounds()[0];
    const bad = { ...sample, type: "遊樂場" };
    expect(playgroundSchema.safeParse(bad).success).toBe(false);
  });

  it("buildGoogleMapsNavUrl 以頁面名稱＋縣市為 destination，不是座標圖釘", () => {
    const place = getPlayground("ty-fenghe");
    expect(place).toBeDefined();
    if (!place) return;

    const url = buildGoogleMapsNavUrl(place);
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(
      "https://www.google.com/maps/dir/",
    );
    expect(parsed.searchParams.get("api")).toBe("1");
    expect(parsed.searchParams.get("destination")).toBe(
      `${place.name}, ${place.city}`,
    );
    expect(parsed.searchParams.get("travelmode")).toBe("driving");
    expect(parsed.searchParams.get("dir_action")).toBe("navigate");
    expect(parsed.searchParams.has("origin")).toBe(false);
    expect(parsed.searchParams.has("destination_place_id")).toBe(false);
  });

  it("mapsQuery 優先於 name＋city（ty-casti）", () => {
    const place = getPlayground("ty-casti");
    expect(place).toBeDefined();
    if (!place) return;

    expect(place.mapsQuery).toBe("卡司蒂菈樂園 中壢");
    expect(playgroundMapsSearchQuery(place)).toBe("卡司蒂菈樂園 中壢");
    expect(playgroundMapsSearchQuery(place)).not.toBe(
      `${place.name}, ${place.city}`,
    );

    const dest = new URL(buildGoogleMapsNavUrl(place)).searchParams.get(
      "destination",
    );
    const query = new URL(buildGoogleMapsPlaceUrl(place)).searchParams.get(
      "query",
    );
    expect(dest).toBe("卡司蒂菈樂園 中壢");
    expect(query).toBe("卡司蒂菈樂園 中壢");
  });

  it("有 placeId 時導航與搜尋帶 *_place_id（測試用物件，不寫進資料列）", () => {
    const fixture = {
      name: "測試場館",
      city: "桃園市",
      mapsQuery: "測試查詢字串",
      placeId: "ChIJ_test_fixture_not_real",
    };
    const nav = new URL(buildGoogleMapsNavUrl(fixture));
    expect(nav.searchParams.get("destination")).toBe("測試查詢字串");
    expect(nav.searchParams.get("destination_place_id")).toBe(
      "ChIJ_test_fixture_not_real",
    );
    expect(nav.searchParams.has("origin")).toBe(false);

    const search = new URL(buildGoogleMapsPlaceUrl(fixture));
    expect(search.searchParams.get("query")).toBe("測試查詢字串");
    expect(search.searchParams.get("query_place_id")).toBe(
      "ChIJ_test_fixture_not_real",
    );
  });

  it("每一筆導航 destination 不是座標，且等於 mapsQuery 或 name＋city", () => {
    const coordOnly = /^-?\d+(\.\d+)?,\s*-?\d+/;
    for (const place of listPlaygrounds()) {
      const dest = new URL(buildGoogleMapsNavUrl(place)).searchParams.get(
        "destination",
      );
      expect(dest, place.id).toBe(
        place.mapsQuery ?? `${place.name}, ${place.city}`,
      );
      expect(dest, place.id).not.toMatch(coordOnly);
    }
  });

  it("buildGoogleMapsPlaceUrl 以頁面名稱搜尋，不是座標", () => {
    const place = getPlayground("ty-fenghe");
    expect(place).toBeDefined();
    if (!place) return;

    const url = buildGoogleMapsPlaceUrl(place);
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(
      "https://www.google.com/maps/search/",
    );
    expect(parsed.searchParams.get("api")).toBe("1");
    expect(parsed.searchParams.get("query")).toBe(
      `${place.name}, ${place.city}`,
    );
  });

  it("address 以 city 開頭，有 district 則含 district", () => {
    for (const item of listPlaygrounds()) {
      expect(item.address.startsWith(item.city), item.id).toBe(true);
      if (item.district) {
        expect(item.address.includes(item.district), item.id).toBe(true);
      }
    }
  });

  it("address 不得含「附近」", () => {
    for (const item of listPlaygrounds()) {
      expect(item.address.includes("附近"), item.id).toBe(false);
    }
  });

  it("先前錯址改為可導航門牌", () => {
    expect(getPlayground("ty-fenghe")?.address).toBe(
      "桃園市桃園區慈文路688號",
    );
    expect(getPlayground("hc-zoo")?.address).toBe("新竹市東區食品路66號");
    expect(getPlayground("hcx-xinwaya")?.address).toBe(
      "新竹縣竹北市文興路一段123號",
    );
    expect(getPlayground("tc-metro-park")?.address).toBe(
      "台中市西屯區都會園路1215巷140號",
    );
    expect(getPlayground("nto-xiangshan")?.address).toBe(
      "南投縣魚池鄉中山路599號",
    );
    expect(getPlayground("hcx-hukou-sports")?.mapsQuery).toBe(
      "王爺壟運動公園 湖口",
    );
    expect(getPlayground("hcx-hukou-sports")?.address).toBe(
      "新竹縣湖口鄉中山路一段789號",
    );
  });

  /**
   * 縣市 lat/lng 粗篩。只抓「縣市欄位與座標明顯不符」；
   * 同縣市錯置（例如桃園觀音 vs 中壢）抓不到，不能取代人工複核。
   * 範圍依地理邊界加邊際，不為遷就錯誤資料而放寬。
   */
  const CITY_BOUNDS: Record<
    string,
    { lat: readonly [number, number]; lng: readonly [number, number] }
  > = {
    基隆市: { lat: [25.05, 25.2], lng: [121.68, 121.85] },
    台北市: { lat: [24.96, 25.22], lng: [121.45, 121.67] },
    新北市: { lat: [24.67, 25.32], lng: [121.28, 122.01] },
    桃園市: { lat: [24.7, 25.15], lng: [120.98, 121.4] },
    新竹市: { lat: [24.76, 24.87], lng: [120.88, 121.03] },
    新竹縣: { lat: [24.45, 24.95], lng: [120.88, 121.35] },
    苗栗縣: { lat: [24.3, 24.75], lng: [120.6, 121.05] },
    台中市: { lat: [24.05, 24.45], lng: [120.45, 121.0] },
    彰化縣: { lat: [23.8, 24.2], lng: [120.25, 120.7] },
    南投縣: { lat: [23.65, 24.15], lng: [120.65, 121.25] },
    雲林縣: { lat: [23.5, 23.85], lng: [120.15, 120.7] },
  };

  it("每筆 lat/lng 落在該縣市粗篩範圍", () => {
    for (const item of listPlaygrounds()) {
      const bounds = CITY_BOUNDS[item.city];
      expect(
        bounds,
        `${item.id} 缺少 ${item.city} 的 CITY_BOUNDS，請補地理範圍`,
      ).toBeDefined();
      if (!bounds) continue;
      expect(
        item.lat,
        `${item.id} lat ${item.lat} 超出 ${item.city} ${bounds.lat.join("–")}`,
      ).toBeGreaterThanOrEqual(bounds.lat[0]);
      expect(
        item.lat,
        `${item.id} lat ${item.lat} 超出 ${item.city} ${bounds.lat.join("–")}`,
      ).toBeLessThanOrEqual(bounds.lat[1]);
      expect(
        item.lng,
        `${item.id} lng ${item.lng} 超出 ${item.city} ${bounds.lng.join("–")}`,
      ).toBeGreaterThanOrEqual(bounds.lng[0]);
      expect(
        item.lng,
        `${item.id} lng ${item.lng} 超出 ${item.city} ${bounds.lng.join("–")}`,
      ).toBeLessThanOrEqual(bounds.lng[1]);
    }
  });

  it("nt-435 是板橋 435 藝文特區，不是鶯歌美術館", () => {
    const place = getPlayground("nt-435");
    expect(place).toBeDefined();
    if (!place) return;
    expect(place.name).toBe("板橋 435 藝文特區");
    expect(place.district).toBe("板橋區");
    expect(place.address).toBe("新北市板橋區中正路435號");
    expect(place.officialUrl).toBe("https://www.435.culture.ntpc.gov.tw/");
    expect(place.mapsQuery).toBe("板橋435藝文特區");
    expect(
      place.sources.some((source) => source.url.includes("ntcart.museum")),
    ).toBe(false);
  });

  it("ty-casti 顯示名與 Maps 查詢分開", () => {
    const place = getPlayground("ty-casti");
    expect(place).toBeDefined();
    if (!place) return;
    expect(place.name).toBe("卡司‧蒂菈樂園");
    expect(place.mapsQuery).toBe("卡司蒂菈樂園 中壢");
  });

  it("ty-xpark 在中壢青埔而非觀音", () => {
    const place = getPlayground("ty-xpark");
    expect(place).toBeDefined();
    if (!place) return;
    expect(place.district).toBe("中壢區");
    expect(place.address).toBe("桃園市中壢區春德路105號");
    expect(place.lat).toBe(25.0128);
    expect(place.lng).toBe(121.2135);
    expect(place.mapsQuery).toBe("Xpark 中壢");
  });

  it("nto-paper-dome 是紙教堂見學園區，不是新桃花源農莊", () => {
    const place = getPlayground("nto-paper-dome");
    expect(place).toBeDefined();
    if (!place) return;
    expect(place.name).toBe("紙教堂新故鄉見學園區");
    expect(place.mapsQuery).toBe("紙教堂 埔里");
    expect(place.address).toBe("南投縣埔里鎮桃米巷52-12號");
    expect(place.name.includes("新桃花源")).toBe(false);
  });

  it("hcx-dingdong 在新豐鄉康和路，不是湖口德興路", () => {
    const place = getPlayground("hcx-dingdong");
    expect(place).toBeDefined();
    if (!place) return;
    expect(place.district).toBe("新豐鄉");
    expect(place.address).toBe("新竹縣新豐鄉松柏村康和路199號");
    expect(place.address.includes("湖口")).toBe(false);
  });

  it("高風險通用名以 mapsQuery 消歧", () => {
    expect(getPlayground("hc-qingqing")?.mapsQuery).toBe("青青草原 香山");
    expect(getPlayground("ty-chingtang")?.mapsQuery).toBe("青塘園 中壢");
    expect(getPlayground("kl-heping-island")?.name).toBe("和平島地質公園");
    expect(getPlayground("tc-calligraphy-greenway")?.name).toBe(
      "草悟道兒童公園",
    );
    expect(getPlayground("hc-nanliao")?.name).toBe("南寮漁港旅遊服務中心");
    expect(getPlayground("nt-metro-park")?.name).toBe("新北大都會公園");
    expect(getPlayground("nt-sanchong-floodway")?.name).toBe(
      "二重疏洪親水公園",
    );
    expect(getPlayground("tc-lihpao")?.name).toBe("麗寶樂園渡假區");
    expect(getPlayground("tp-children-park")?.name).toBe(
      "臺北市立兒童新樂園",
    );
  });

  it("mapsQuery 不重複（PlayMap 以 destination 反查場館）", () => {
    const queries = listPlaygrounds()
      .map((place) => place.mapsQuery)
      .filter((query): query is string => query !== undefined);
    expect(new Set(queries).size).toBe(queries.length);
  });
});
