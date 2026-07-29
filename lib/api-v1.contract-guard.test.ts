/**
 * 網站 ↔ iOS 的**結構**護欄（與 `api-v1.ios-fixture.test.ts` 的值比對互補）。
 *
 * 兩者失敗的意義完全不同，不可混為一談：
 *
 * | 失敗的檔案 | 意義 | 正確反應 |
 * |---|---|---|
 * | `api-v1.ios-fixture.test.ts` | 只是**內容**變了（多一集、改標題） | `UPDATE_IOS_FIXTURES=1 npm test -- api-v1.ios-fixture` |
 * | 本檔 | **契約**變了（欄位增刪改名、網域搬家） | 停下來，同步改 Swift／entitlements，見 ios/SYNC-WITH-WEB.md |
 *
 * 本檔刻意不比對任何「哪一集、標題是什麼」，所以 Apple 同步進新集**不會**讓它變紅。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getStoryApi, listStoriesApi } from "@/lib/api-v1";
import { iosAssociatedDomainHost } from "@/lib/ios-app-links";
import { CANONICAL_SITE_URL } from "@/lib/site-url";

const SITE = "https://podcast-website-mu.vercel.app";

function iosSource(relative: string): string {
  return readFileSync(join(process.cwd(), "ios", relative), "utf8");
}

/** 列表 DTO 允許出現的欄位（= Swift `StoryListItem` 必須認得的全集）。 */
const LIST_KEYS = [
  "slug",
  "ep",
  "title",
  "date",
  "duration",
  "vehicle",
  "summary",
  "tags",
  "ageRange",
  "color",
  "pageCount",
  "coverUrl",
  "audioUrl",
  "zoneId",
  "hasTranscriptVtt",
] as const;

/** 每一集都必定存在的欄位（Swift 端可宣告為非 optional）。 */
const LIST_REQUIRED_KEYS = [
  "slug",
  "ep",
  "title",
  "date",
  "vehicle",
  "color",
  "pageCount",
  "coverUrl",
  "audioUrl",
  "hasTranscriptVtt",
] as const;

/** 詳情 DTO 在列表欄位之外新增的欄位。 */
const DETAIL_ONLY_KEYS = [
  "pageImageUrls",
  "captions",
  "captionTimes",
  "transcriptVttUrl",
  "reflectionPrompt",
  "characterIds",
] as const;

/** 刻意**不**給 App 的家長／通路內容（見 docs/GEO-CONTENT-CONTRACT.md）。 */
const FORBIDDEN_KEYS = ["familyActivity", "parentGuide", "episodeFaq"] as const;

function unionOfKeys(items: readonly object[]): Set<string> {
  const keys = new Set<string>();
  for (const item of items) {
    for (const key of Object.keys(item)) keys.add(key);
  }
  return keys;
}

function intersectionOfKeys(items: readonly object[]): Set<string> {
  if (items.length === 0) return new Set();
  return items.slice(1).reduce<Set<string>>(
    (acc, item) => new Set(Object.keys(item).filter((k) => acc.has(k))),
    new Set(Object.keys(items[0])),
  );
}

describe("api-v1 ↔ Swift 欄位契約（不隨集數變動）", () => {
  const list = listStoriesApi(SITE);

  it("列表不出現 Swift 沒宣告的欄位", () => {
    // 失敗代表 data/content.ts 的 Story 多了欄位並流進 API：
    // 要嘛在 lib/api-v1.ts 擋掉，要嘛同步加進 ios/CheCheCar/Models/APIModels.swift。
    const allowed: readonly string[] = LIST_KEYS;
    const unknown = [...unionOfKeys(list)].filter((k) => !allowed.includes(k));
    expect(unknown).toEqual([]);
  });

  it("列表必要欄位每一集都在", () => {
    const always = intersectionOfKeys(list);
    for (const key of LIST_REQUIRED_KEYS) {
      expect(always.has(key), `每集都應有 ${key}`).toBe(true);
    }
  });

  it("詳情不出現 Swift 沒宣告的欄位", () => {
    const details = list
      .map((s) => getStoryApi(s.slug, SITE))
      .filter((d): d is NonNullable<typeof d> => d !== null);
    expect(details.length).toBe(list.length);

    const allowed = new Set<string>([...LIST_KEYS, ...DETAIL_ONLY_KEYS]);
    const unknown = [...unionOfKeys(details)].filter((k) => !allowed.has(k));
    expect(unknown).toEqual([]);
  });

  it("家長／通路內容不外洩到 App", () => {
    const details = list
      .map((s) => getStoryApi(s.slug, SITE))
      .filter((d): d is NonNullable<typeof d> => d !== null);
    const leaked = [...unionOfKeys([...list, ...details])].filter((k) =>
      (FORBIDDEN_KEYS as readonly string[]).includes(k),
    );
    expect(leaked).toEqual([]);
  });

  it("每個契約欄位都在 APIModels.swift 出現", () => {
    const models = iosSource("CheCheCar/Models/APIModels.swift");
    for (const key of [...LIST_KEYS, ...DETAIL_ONLY_KEYS]) {
      expect(models, `APIModels.swift 缺 ${key}`).toContain(key);
    }
  });
});

describe("網域搬家護欄", () => {
  it("Swift AppConfig 的正式站 URL 對齊 CANONICAL_SITE_URL", () => {
    // 換網域時，光改 lib/site-url.ts 不夠：App 內建的 base URL 不會跟著動。
    const config = iosSource("CheCheCar/Services/AppConfig.swift");
    expect(config, `AppConfig.swift 應含 ${CANONICAL_SITE_URL}`).toContain(
      CANONICAL_SITE_URL,
    );
  });

  it("Associated Domains 對齊 canonical host（非寫死字串）", () => {
    const entitlements = iosSource("CheCheCar/CheCheCar.entitlements");
    expect(entitlements).toContain(`applinks:${iosAssociatedDomainHost()}`);
  });
});
