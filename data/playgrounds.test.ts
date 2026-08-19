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
  computePlaygroundBaseline,
  FACILITY_LIST_TAIL_PATTERN,
} from "@/lib/playground-baseline";
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

  it("id 可作為全域唯一且合法的 HTML fragment identifier", () => {
    const ids = listPlaygrounds().map((item) => item.id);
    expect(ids.every((id) => /^[A-Za-z][A-Za-z0-9_-]*$/.test(id))).toBe(true);
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
        item.tips.includes(UI_VOLATILITY_NOTICE),
        `${item.id} 的 tips 重複了元件已渲染的固定提示`,
      ).toBe(false);
    }
  });

  it("lastVerified 在 365 天內", () => {
    const now = Date.now();
    const maxAgeMs = 365 * 24 * 60 * 60 * 1000;
    for (const item of listPlaygrounds()) {
      const verifiedAt = parseIsoDate(item.lastVerified).getTime();
      expect(
        now - verifiedAt,
        `${item.id} lastVerified=${item.lastVerified}`,
      ).toBeLessThanOrEqual(maxAgeMs);
    }
  });

  /**
   * 「場內有 X、Y、Z。」型尾句——與 facilities 陣列重複的設施列舉。
   * 卡片層的 composeParentBlurb 早就在過濾它（見 lib/playground-parent-voice.ts）。
   */
  const FACILITY_TAIL = FACILITY_LIST_TAIL_PATTERN;

  /*
   * status 是「今天過去會撲空」的阻擋條件，必須有依據。
   * 沒有 coverageNote 就無從得知是哪一則公告、何時查的，下一個維護的人
   * 也無法判斷該不該解除標記。
   */
  it("標記 status 的場館必須有 coverageNote 說明依據", () => {
    for (const item of listPlaygrounds()) {
      if (!item.status) continue;
      expect(
        (item.coverageNote ?? "").length,
        `${item.id} 標了 status=${item.status} 卻沒有 coverageNote`,
      ).toBeGreaterThan(0);
    }
  });

  it("tips 不得留下佔位或待辦字樣", () => {
    const placeholder = /待[^。]{0,40}定稿|定稿中|TODO|FIXME|XXX|待補|待撰|佔位/;
    for (const item of listPlaygrounds()) {
      expect(
        placeholder.test(item.tips),
        `${item.id} 的 tips 仍是佔位字串：${item.tips}`,
      ).toBe(false);
    }
  });

  /*
   * 原本這條要求 tips 必須包含某個 facility 或 tag 名稱，用意是逼出「場館專屬」
   * 而非通用的句子。實際效果相反：作者寫不出自然帶到設施名的句子，就在句尾接
   * 「場內有 X、Y、Z。」把契約湊過去——73 筆全部有這個尾句，其中 47 筆一旦
   * 拿掉尾句就過不了。這正是 tips 剝除尾句後中位數只剩 24 字的成因。
   *
   * 改成：設施名命中「或」剝除尾句後仍有足量家長專屬敘述，兩者擇一即可。
   * 這讓寫得好、但沒剛好提到設施名的筆記過得了，同時不必一次改寫全部 73 筆。
   * 待既有資料補寫完成後，再收緊為「一律禁止設施列舉尾句」。
   */
  it("tips 必填、夠長，且具場館專屬資訊", () => {
    const skipTags = new Set(["免費", "室內"]);
    for (const item of listPlaygrounds()) {
      const tips = item.tips.trim();
      expect(tips.length, `${item.id} tips 過短`).toBeGreaterThanOrEqual(28);
      const facilityHit = item.facilities.some(
        (facility) => facility.length >= 2 && tips.includes(facility),
      );
      const tagHit = item.tags.some(
        (tag) =>
          tag.length >= 2 && !skipTags.has(tag) && tips.includes(tag),
      );
      const bodyLength = tips.replace(FACILITY_TAIL, "").trim().length;
      expect(
        facilityHit || tagHit || bodyLength >= 28,
        `${item.id} tips 既沒對到 facilities／tags，剝除設施尾句後也不足 28 字：${tips}`,
      ).toBe(true);
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

  it("coverageNote 若存在則為非空字串", () => {
    for (const item of listPlaygrounds()) {
      if (item.coverageNote === undefined) continue;
      expect(item.coverageNote.trim().length, item.id).toBeGreaterThan(0);
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

    expect(place.mapsQuery).toBe("卡司蒂菈樂園 蘆竹");
    expect(playgroundMapsSearchQuery(place)).toBe("卡司蒂菈樂園 蘆竹");
    expect(playgroundMapsSearchQuery(place)).not.toBe(
      `${place.name}, ${place.city}`,
    );

    const dest = new URL(buildGoogleMapsNavUrl(place)).searchParams.get(
      "destination",
    );
    const query = new URL(buildGoogleMapsPlaceUrl(place)).searchParams.get(
      "query",
    );
    expect(dest).toBe("卡司蒂菈樂園 蘆竹");
    expect(query).toBe("卡司蒂菈樂園 蘆竹");
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
    expect(getPlayground("hcx-hukou-sports")?.name).toBe("王爺壟運動公園");
    expect(getPlayground("hcx-hukou-sports")?.mapsQuery).toBeUndefined();
    expect(getPlayground("hcx-hukou-sports")?.address).toBe(
      "新竹縣湖口鄉中山路一段789號",
    );
    expect(getPlayground("hcx-hukou-sports")?.coverageNote).toBe(
      "以運動設施為主，幼童遊具待現場確認",
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
    嘉義市: { lat: [23.44, 23.53], lng: [120.4, 120.5] },
    // 嘉義縣包住嘉義市並向西延伸到東石／布袋海線、向東到阿里山，範圍較寬。
    嘉義縣: { lat: [23.2, 23.68], lng: [120.1, 120.9] },
    台南市: { lat: [22.88, 23.4], lng: [120.05, 120.65] },
    // 高雄市南北狹長：從旗津／小港一路到那瑪夏、桃源山區。
    高雄市: { lat: [22.4, 23.35], lng: [120.15, 121.05] },
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
    expect(place.mapsQuery).toBe("卡司蒂菈樂園 蘆竹");
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

  it("city／address 用台，場館官名用臺", () => {
    for (const item of listPlaygrounds()) {
      expect(item.city, `${item.id} city`).not.toMatch(/臺/);
      expect(item.address, `${item.id} address`).not.toMatch(/臺/);
      expect(item.name, `${item.id} name 官名應作臺`).not.toMatch(
        /^台[北中南東]/,
      );
    }
    expect(getPlayground("tc-taichung-park")?.name).toBe("臺中公園");
    expect(getPlayground("tc-metro-park")?.name).toBe("臺中都會公園");
    expect(getPlayground("tp-children-park")?.name).toBe(
      "臺北市立兒童新樂園",
    );
  });

  it("高風險通用名以 mapsQuery 消歧", () => {
    expect(getPlayground("hc-qingqing")?.mapsQuery).toBe("青青草原 香山");
    expect(getPlayground("ty-chingtang")?.mapsQuery).toBe("青塘園 中壢");
    expect(getPlayground("kl-heping-island")?.name).toBe("和平島地質公園");
    expect(getPlayground("tc-calligraphy-greenway")?.name).toBe(
      "草悟道兒童公園",
    );
    expect(getPlayground("hc-nanliao")?.name).toBe("南寮親子沙灘");
    expect(getPlayground("hc-nanliao")?.mapsQuery).toBe(
      "南寮漁港旅遊服務中心",
    );
    expect(getPlayground("hc-nanliao")?.tips).not.toContain("導航落點");
    expect(getPlayground("hc-nanliao")?.tips).not.toContain("旅遊服務中心");
    expect(
      FACILITY_LIST_TAIL_PATTERN.test(getPlayground("hc-nanliao")?.tips ?? ""),
    ).toBe(false);
    expect(getPlayground("hc-nanliao")?.coverageNote).toBe(
      "導航落點為南寮漁港旅遊服務中心，實際遊戲區在旁邊步行可達。",
    );
    expect(getPlayground("hc-nanliao")?.lastVerified).toBe("2026-08-13");
    expect(getPlayground("nt-metro-park")?.name).toBe("新北大都會公園");
    expect(getPlayground("nt-sanchong-floodway")?.name).toBe(
      "二重疏洪親水公園",
    );
    expect(getPlayground("tc-lihpao")?.name).toBe("麗寶樂園渡假區");
    expect(getPlayground("tp-children-park")?.name).toBe(
      "臺北市立兒童新樂園",
    );
  });

  it("mapsQuery 不重複（相同字串會導到同一地點，屬重複資料）", () => {
    const queries = listPlaygrounds()
      .map((place) => place.mapsQuery)
      .filter((query): query is string => query !== undefined);
    expect(new Set(queries).size).toBe(queries.length);
  });

  it("officialUrl 若存在則不與其他場館重複", () => {
    const urls = listPlaygrounds()
      .map((place) => place.officialUrl)
      .filter((url): url is string => url !== undefined);
    expect(new Set(urls).size).toBe(urls.length);
  });
});

/** A1 查證日期；只鎖「有查過」，不鎖 feeNote 全文。 */
const A1_VERIFIED_ON = "2026-08-19";

const A1_PAID_FEE_NOTE_IDS = [
  "ty-casti",
  "ty-xpark",
  "tp-zoo",
  "tp-water-museum",
  "nt-yingge-ceramic",
  "nt-juming",
  "kl-nmmst",
  "kl-heping-island",
  "tc-lihpao",
] as const;

describe("A1 factual trust", () => {
  it("A1 九筆付費場皆有 feeNote，且 lastVerified 為本次查證日", () => {
    for (const id of A1_PAID_FEE_NOTE_IDS) {
      const place = getPlayground(id);
      expect(place, id).toBeDefined();
      if (!place) continue;
      expect(place.free, id).toBe(false);
      expect(place.feeNote?.trim().length, id).toBeGreaterThan(8);
      expect(place.lastVerified, id).toBe(A1_VERIFIED_ON);
    }
  });

  it("A1 feeNote 含關鍵決策條件，不鎖全文", () => {
    expect(getPlayground("ty-casti")?.feeNote).toMatch(/90\s*公分/);
    expect(getPlayground("ty-xpark")?.feeNote).toMatch(/未滿\s*4\s*歲/);
    expect(getPlayground("tp-zoo")?.feeNote).toMatch(/普通票/);
    expect(getPlayground("tp-water-museum")?.feeNote).toMatch(/親水/);
    expect(getPlayground("nt-yingge-ceramic")?.feeNote).toMatch(/80/);
    expect(getPlayground("nt-juming")?.feeNote).toMatch(/6\s*歲/);
    expect(getPlayground("kl-nmmst")?.feeNote).toMatch(/主題館|分館/);
    expect(getPlayground("kl-heping-island")?.feeNote).toMatch(
      /未滿\s*6\s*歲|岩石/,
    );
    expect(getPlayground("tc-lihpao")?.feeNote).toMatch(/馬拉灣|探索世界/);
  });

  it("kl-heping-island officialUrl 指向地質公園營運站", () => {
    const place = getPlayground("kl-heping-island");
    expect(place?.officialUrl).toBe("https://www.hpigeopark.org/");
    expect(place?.officialUrl).not.toContain("northguan-nsa.gov.tw");
    expect(
      place?.sources.some((source) =>
        source.url.includes("hpigeopark.org/hours-admission"),
      ),
    ).toBe(true);
  });

  it("tc-lihpao officialUrl 指向樂園而非建設公司", () => {
    const place = getPlayground("tc-lihpao");
    expect(place?.officialUrl).toBe("https://www.lihpaoresort.com/");
    expect(place?.officialUrl).not.toContain("lihpao.com.tw");
    expect(
      place?.sources.some((source) => source.url.includes("lihpao.com.tw")),
    ).toBe(false);
  });

  it("ty-puhsin 仍為暫時休園，且本次有複核", () => {
    const place = getPlayground("ty-puhsin");
    expect(place?.status).toBe("temporarily-closed");
    expect(place?.lastVerified).toBe(A1_VERIFIED_ON);
    expect(place?.coverageNote).toMatch(/2026-08-19/);
    expect(
      place?.sources.some((source) =>
        source.url.includes("pushin-ranch.com/news-detail/170"),
      ),
    ).toBe(true);
  });

  it("ty-casti 訪客位置在蘆竹大竹北路，不是中壢大江", () => {
    const place = getPlayground("ty-casti");
    expect(place).toBeDefined();
    if (!place) return;
    expect(place.city).toBe("桃園市");
    expect(place.district).toBe("蘆竹區");
    expect(place.address).toBe("桃園市蘆竹區大竹北路 90-66 號");
    expect(place.address).not.toMatch(/中園路/);
    expect(place.district).not.toBe("中壢區");
    // 官方園區地址 Google 地圖釘 !8m2!3d25.0315274!4d121.2534857
    expect(place.lat).toBeCloseTo(25.03153, 4);
    expect(place.lng).toBeCloseTo(121.25349, 4);
    expect(place.lat).not.toBe(24.9658);
    expect(place.lng).not.toBe(121.2212);
    expect(place.mapsQuery).toBe("卡司蒂菈樂園 蘆竹");
    expect(place.coverageNote).toBeUndefined();
  });
});

const A2_TIPS_PILOT_IDS = [
  "ty-casti",
  "ty-xpark",
  "tp-children-park",
  "tp-zoo",
  "tp-water-museum",
  "nt-yingge-ceramic",
  "nt-juming",
  "kl-nmmst",
  "kl-heping-island",
  "tc-lihpao",
  "ty-kids-museum",
  "nt-435",
  "tp-shilin-residence",
  "nt-sanchong-floodway",
  "hc-qingqing",
] as const;

/** 僅文案改寫、未做 A1 事實查證的試點；lastVerified 不得因改寫 tips 而改動。 */
const A2_COPY_ONLY_LAST_VERIFIED = {
  "ty-kids-museum": "2026-08-11",
  "tp-children-park": "2026-08-11",
  "nt-435": "2026-08-13",
  "tp-shilin-residence": "2026-08-09",
  "nt-sanchong-floodway": "2026-08-09",
  "hc-qingqing": "2026-08-09",
} as const;

const SALESY_TIP_PATTERN =
  /必去|超好玩|絕對不能錯過|小孩一定會愛|CP值超高|網美|打卡必去/;

describe("A2 tips quality pilot", () => {
  it("試點 tips 非空，且不再使用設施列舉尾句", () => {
    for (const id of A2_TIPS_PILOT_IDS) {
      const place = getPlayground(id);
      expect(place, id).toBeDefined();
      if (!place) continue;
      expect(place.tips.trim().length, id).toBeGreaterThan(8);
      expect(
        FACILITY_LIST_TAIL_PATTERN.test(place.tips),
        `${id} 仍是「場／園／館內有…」尾句：${place.tips}`,
      ).toBe(false);
      expect(
        /(?:場|園|館)內有/.test(place.tips),
        `${id} 仍把設施清單寫進 tips：${place.tips}`,
      ).toBe(false);
      expect(
        SALESY_TIP_PATTERN.test(place.tips),
        `${id} tips 含推銷用語：${place.tips}`,
      ).toBe(false);
      expect(place.relatedEpisodes, id).toBeUndefined();
    }
  });

  it("試點沒有改成同一句開頭", () => {
    const openings = A2_TIPS_PILOT_IDS.map((id) => {
      const tips = getPlayground(id)?.tips ?? "";
      return tips.slice(0, 4);
    });
    expect(new Set(openings).size).toBeGreaterThan(10);
  });

  it("僅文案改寫的試點不更新 lastVerified", () => {
    for (const [id, verified] of Object.entries(A2_COPY_ONLY_LAST_VERIFIED)) {
      expect(getPlayground(id)?.lastVerified, id).toBe(verified);
    }
  });

  it("試點已離開 tipsDebt，但全庫尾句債仍在（未一次清完）", () => {
    const { tipsDebt } = computePlaygroundBaseline();
    const remaining = new Set(tipsDebt.placeIds);
    for (const id of A2_TIPS_PILOT_IDS) {
      expect(remaining.has(id), id).toBe(false);
    }
    expect(tipsDebt.count).toBeGreaterThan(0);
    expect(tipsDebt.count).toBe(14);
  });
});

const A3_TIPS_ROUND2_IDS = [
  "hcx-zhudong-forestry",
  "nto-xiangshan",
  "nto-checheng",
  "ch-fan-garage",
  "hc-xiangshan-wetland",
  "tc-gaomei",
  "hcx-xinwaya",
  "nt-tamsui-shalun",
  "hcx-neiwan",
  "hcx-hukou-sports",
  "tc-fengle",
  "nt-metro-park",
  "tp-rongxing",
  "ch-baguashan",
  "yl-gukeng-tunnel",
] as const;

/** A2 成稿開頭；A3 不得回寫這 15 筆。 */
const A2_TIP_OPENINGS = {
  "ty-casti": "室內球池",
  "ty-xpark": "平日或剛",
  "tp-children-park": "入園票不",
  "tp-zoo": "坡道多，",
  "tp-water-museum": "博物館與",
  "nt-yingge-ceramic": "陶藝體驗",
  "nt-juming": "以戶外雕",
  "kl-nmmst": "主題館分",
  "kl-heping-island": "岩石區濕",
  "tc-lihpao": "樂園與 ",
  "ty-kids-museum": "部分創作",
  "nt-435": "常設展多",
  "tp-shilin-residence": "戶外公園",
  "nt-sanchong-floodway": "親水設施",
  "hc-qingqing": "草原開闊",
} as const;

const A3_COPY_ONLY_LAST_VERIFIED = {
  "hcx-zhudong-forestry": "2026-08-13",
  "nto-xiangshan": "2026-08-13",
  "nto-checheng": "2026-08-13",
  "ch-fan-garage": "2026-08-13",
  "hc-xiangshan-wetland": "2026-08-13",
  "tc-gaomei": "2026-08-13",
  "hcx-xinwaya": "2026-08-13",
  "nt-tamsui-shalun": "2026-08-13",
  "hcx-neiwan": "2026-08-13",
  "hcx-hukou-sports": "2026-08-13",
  "tc-fengle": "2026-08-13",
  "nt-metro-park": "2026-08-13",
  "tp-rongxing": "2026-08-09",
  "ch-baguashan": "2026-08-13",
  "yl-gukeng-tunnel": "2026-08-09",
} as const;

describe("A3 tips quality round 2", () => {
  it("不與 A2 試點重疊", () => {
    const overlap = A3_TIPS_ROUND2_IDS.filter((id) =>
      (A2_TIPS_PILOT_IDS as readonly string[]).includes(id),
    );
    expect(overlap).toEqual([]);
  });

  it("A2 成稿開頭維持不變", () => {
    for (const [id, opening] of Object.entries(A2_TIP_OPENINGS)) {
      expect(getPlayground(id)?.tips.slice(0, 4), id).toBe(opening);
    }
  });

  it("第二輪 tips 非空，且不再使用設施列舉尾句", () => {
    for (const id of A3_TIPS_ROUND2_IDS) {
      const place = getPlayground(id);
      expect(place, id).toBeDefined();
      if (!place) continue;
      expect(place.tips.trim().length, id).toBeGreaterThan(8);
      expect(
        FACILITY_LIST_TAIL_PATTERN.test(place.tips),
        `${id} 仍是「場／園／館內有…」尾句：${place.tips}`,
      ).toBe(false);
      expect(
        /(?:場|園|館)內有/.test(place.tips),
        `${id} 仍把設施清單寫進 tips：${place.tips}`,
      ).toBe(false);
      expect(
        SALESY_TIP_PATTERN.test(place.tips),
        `${id} tips 含推銷用語：${place.tips}`,
      ).toBe(false);
      expect(place.relatedEpisodes, id).toBeUndefined();
      expect(place.free, id).toBe(true);
    }
  });

  it("第二輪沒有改成同一句開頭", () => {
    const openings = A3_TIPS_ROUND2_IDS.map((id) => {
      const tips = getPlayground(id)?.tips ?? "";
      return tips.slice(0, 4);
    });
    expect(new Set(openings).size).toBeGreaterThan(10);
  });

  it("第二輪不更新 lastVerified", () => {
    for (const [id, verified] of Object.entries(A3_COPY_ONLY_LAST_VERIFIED)) {
      expect(getPlayground(id)?.lastVerified, id).toBe(verified);
    }
  });

  it("王爺壟 coverageNote 不因改 tips 而變動", () => {
    expect(getPlayground("hcx-hukou-sports")?.coverageNote).toBe(
      "以運動設施為主，幼童遊具待現場確認",
    );
  });

  it("第二輪已離開 tipsDebt，全庫尾句債仍未清完", () => {
    const { tipsDebt } = computePlaygroundBaseline();
    const remaining = new Set(tipsDebt.placeIds);
    for (const id of A3_TIPS_ROUND2_IDS) {
      expect(remaining.has(id), id).toBe(false);
    }
    expect(tipsDebt.count).toBeGreaterThan(0);
    expect(tipsDebt.count).toBe(14);
  });
});

const A4_TIPS_FINAL_IDS = [
  "tp-da-an-park",
  "hc-hsinchu-park",
  "hc-nanliao",
  "ty-chingtang",
  "kl-chaojing",
  "kl-chungcheng-park",
  "tc-qiuhonggu",
  "tc-calligraphy-greenway",
  "ch-lukang-children",
  "yl-beigang-park",
  "nt-linkou-sports",
  "ty-yangming",
] as const;

/** A3 成稿開頭；A4 不得回寫。 */
const A3_TIP_OPENINGS = {
  "hcx-zhudong-forestry": "展館不大",
  "nto-xiangshan": "建築內可",
  "nto-checheng": "木業館可",
  "ch-fan-garage": "現場有列",
  "hc-xiangshan-wetland": "潮間帶濕",
  "tc-gaomei": "請走木棧",
  "hcx-xinwaya": "戶外廣場",
  "nt-tamsui-shalun": "以戲沙、",
  "hcx-neiwan": "親水區玩",
  "hcx-hukou-sports": "直排輪、",
  "tc-fengle": "雕塑區的",
  "nt-metro-park": "園區幅員",
  "tp-rongxing": "遊戲場設",
  "ch-baguashan": "帶小孩可",
  "yl-gukeng-tunnel": "走的是林",
} as const;

const A4_COPY_ONLY_LAST_VERIFIED = {
  "tp-da-an-park": "2026-08-09",
  "hc-hsinchu-park": "2026-08-09",
  "hc-nanliao": "2026-08-13",
  "ty-chingtang": "2026-08-13",
  "kl-chaojing": "2026-08-11",
  "kl-chungcheng-park": "2026-08-11",
  "tc-qiuhonggu": "2026-08-13",
  "tc-calligraphy-greenway": "2026-08-09",
  "ch-lukang-children": "2026-08-09",
  "yl-beigang-park": "2026-08-09",
  "nt-linkou-sports": "2026-08-09",
  "ty-yangming": "2026-08-09",
} as const;

describe("A4 tips quality final round", () => {
  it("不與 A2／A3 試點重疊", () => {
    const prior = new Set<string>([
      ...A2_TIPS_PILOT_IDS,
      ...A3_TIPS_ROUND2_IDS,
    ]);
    expect(A4_TIPS_FINAL_IDS.filter((id) => prior.has(id))).toEqual([]);
  });

  it("A2／A3 成稿開頭維持不變", () => {
    for (const [id, opening] of Object.entries(A2_TIP_OPENINGS)) {
      expect(getPlayground(id)?.tips.slice(0, 4), id).toBe(opening);
    }
    for (const [id, opening] of Object.entries(A3_TIP_OPENINGS)) {
      expect(getPlayground(id)?.tips.slice(0, 4), id).toBe(opening);
    }
  });

  it("最終輪 tips 非空，且不再使用設施列舉尾句", () => {
    for (const id of A4_TIPS_FINAL_IDS) {
      const place = getPlayground(id);
      expect(place, id).toBeDefined();
      if (!place) continue;
      expect(place.tips.trim().length, id).toBeGreaterThan(8);
      expect(
        FACILITY_LIST_TAIL_PATTERN.test(place.tips),
        `${id} 仍是「場／園／館內有…」尾句：${place.tips}`,
      ).toBe(false);
      expect(
        /(?:場|園|館)內有/.test(place.tips),
        `${id} 仍把設施清單寫進 tips：${place.tips}`,
      ).toBe(false);
      expect(
        SALESY_TIP_PATTERN.test(place.tips),
        `${id} tips 含推銷用語：${place.tips}`,
      ).toBe(false);
      expect(place.relatedEpisodes, id).toBeUndefined();
      expect(place.free, id).toBe(true);
    }
  });

  it("最終輪沒有改成同一句開頭", () => {
    const openings = A4_TIPS_FINAL_IDS.map((id) => {
      const tips = getPlayground(id)?.tips ?? "";
      return tips.slice(0, 4);
    });
    expect(new Set(openings).size).toBeGreaterThan(8);
  });

  it("最終輪不更新 lastVerified", () => {
    for (const [id, verified] of Object.entries(A4_COPY_ONLY_LAST_VERIFIED)) {
      expect(getPlayground(id)?.lastVerified, id).toBe(verified);
    }
  });

  it("南寮 coverageNote／mapsQuery 不因改 tips 而變動", () => {
    const place = getPlayground("hc-nanliao");
    expect(place?.mapsQuery).toBe("南寮漁港旅遊服務中心");
    expect(place?.coverageNote).toBe(
      "導航落點為南寮漁港旅遊服務中心，實際遊戲區在旁邊步行可達。",
    );
    expect(place?.tips).not.toContain("導航落點");
  });

  it("最終輪已離開 tipsDebt，全庫尾句債仍未清完、也不求清零", () => {
    const { tipsDebt } = computePlaygroundBaseline();
    const remaining = new Set(tipsDebt.placeIds);
    for (const id of A4_TIPS_FINAL_IDS) {
      expect(remaining.has(id), id).toBe(false);
    }
    expect(tipsDebt.count).toBeGreaterThan(0);
    expect(tipsDebt.count).toBe(14);
  });
});

describe("B1 Chiayi City diversity — 嘉義公園", () => {
  it("只新增一筆戶外免費公園，且 ID 遵循 cyc- 前綴", () => {
    const place = getPlayground("cyc-chiayi-park");
    expect(place).toBeDefined();
    expect(place?.name).toBe("嘉義公園");
    expect(place?.city).toBe("嘉義市");
    expect(place?.district).toBe("東區");
    expect(place?.address).toBe("嘉義市東區啟明路264號");
    expect(place?.type).toBe("公園");
    expect(place?.free).toBe(true);
    expect(place?.indoor).toBe(false);
    expect(place?.status).toBeUndefined();
    expect(place?.relatedEpisodes).toBeUndefined();
    expect(place?.ageRange).toEqual([3, 8]);
  });

  it("座標採用觀光署嘉義公園頁，不是棒球場／KANO", () => {
    const place = getPlayground("cyc-chiayi-park");
    expect(place?.lat).toBe(23.483329);
    expect(place?.lng).toBe(120.46523);
  });

  it("公園本身免費、戶外，射日塔不另開一筆", () => {
    expect(getPlayground("cyc-chiayi-park")?.free).toBe(true);
    expect(listPlaygrounds().some((item) => item.name === "射日塔")).toBe(
      false,
    );
  });

  it("tips 只寫分散入口與登塔另購票，不含內部對照用語", () => {
    const tips = getPlayground("cyc-chiayi-park")?.tips ?? "";
    expect(tips).toBe(
      "遊戲場分散在公園不同入口；射日塔位於園內，但登塔需另購票。",
    );
    expect(tips).not.toContain("這裡是戶外公園，不是室內館");
    expect(tips.length).toBeGreaterThanOrEqual(28);
  });

  it("嘉義市 census：5／5／2 free／4 indoor／1 outdoor", () => {
    const { cities, launchRegistry, global } = computePlaygroundBaseline();
    const chiayiCity = cities.find((row) => row.city === "嘉義市");
    expect(chiayiCity).toMatchObject({
      total: 5,
      operating: 5,
      freeActive: 2,
      indoorActive: 4,
      outdoorActive: 1,
    });
    expect(global.total).toBe(97);
    expect(launchRegistry.total).toBe(20);
    expect(launchRegistry.unlaunchedCitySlugs).toEqual([]);
  });

  it("chiayi-city 已上線，且不再與 indoor 完全重複", () => {
    const { candidates, candidateExactDuplicates, launchRegistry } =
      computePlaygroundBaseline();
    const city = candidates.find((row) => row.slug === "chiayi-city");
    const indoor = candidates.find((row) => row.slug === "chiayi-city-indoor");
    const rainy = candidates.find((row) => row.slug === "chiayi-city-rainy-day");
    expect(city?.activeCount).toBe(5);
    expect(indoor?.activeCount).toBe(4);
    expect(rainy?.activeCount).toBe(4);
    expect(city?.currentlyLaunched).toBe(true);
    expect(indoor?.currentlyLaunched).toBe(false);
    expect(rainy?.currentlyLaunched).toBe(false);
    expect(launchRegistry.slugs).toContain("chiayi-city");
    expect(launchRegistry.slugs).not.toContain("chiayi-city-indoor");
    expect(candidateExactDuplicates).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          slugA: "chiayi-city",
          slugB: "chiayi-city-indoor",
        }),
      ]),
    );
  });
});
