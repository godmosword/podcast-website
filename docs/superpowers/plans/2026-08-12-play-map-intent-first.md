# 親子遊樂地圖意圖優先改版 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 依 `docs/superpowers/specs/2026-08-12-play-map-intent-first-design.md` 把 `/for-parents/play-map` 改成意圖優先、縣市可選、卡片資訊加厚、sticky 篩選與地圖精簡 sheet。

**Architecture:** 純函式距離／排序放 `lib/playground-distance.ts`；URL／filter 契約讓 `city: string | null`；UI 仍集中在 `PlayMap.tsx`（意圖列＋sticky 篩選＋卡片／sheet 強化），CSS Modules 延續 `--map-chip*`。

**Tech Stack:** Next.js 15 App Router、TypeScript strict、CSS Modules、Vitest、Playwright e2e。

## Global Constraints

- 註解與 UI 文案 zh-TW；禁止 `any`
- 動畫只用 transform／opacity；遵守 `prefers-reduced-motion`
- 不改主題系統、宇宙地圖、Apple sync、不呼叫生圖 API
- SEO：全量 playground SSR + `hidden` 不回歸
- 品質閘：`npm test`、`npm run build`、`npx tsc --noEmit`
- 完成更新 `TODOS.md`；conventional commits

## File Map

| File | Role |
|---|---|
| `lib/playground-distance.ts` | haversine、分鐘粗估、sort、推車啟發式、距離文案 |
| `lib/playground-distance.test.ts` | 上列單元測試 |
| `lib/playgrounds-query.ts` | `city: string \| null`；parse／build |
| `lib/playgrounds-query.test.ts` | URL 契約測試更新 |
| `components/for-parents/PlayMap.tsx` | 意圖、sticky、卡片、sheet variant、定位 |
| `components/for-parents/PlayMap.module.css` | 意圖／sticky／compact chip／sheet |
| `components/for-parents/PlayMap.test.tsx` | 元件行為 |
| `app/for-parents/play-map/page.tsx` | 接 null city |
| `e2e/play-map.spec.ts` | 意圖／全部／空狀態 |
| `docs/PLAY-MAP-EDITORIAL.md` | UI 契約一句 |
| `TODOS.md` | 完成條目 |

---

### Task 1: Distance / sort / stroller helpers（TDD）

**Files:**
- Create: `lib/playground-distance.ts`
- Create: `lib/playground-distance.test.ts`

**Interfaces:**
- Produces:
  - `type LatLng = { lat: number; lng: number }`
  - `haversineKm(a: LatLng, b: LatLng): number`
  - `estimateDriveMinutes(km: number): number` — `Math.round(km * 2.8)` clamp 1–90
  - `formatDriveMinutesLabel(minutes: number): string` — `約 ${n} 分鐘`
  - `sortPlaygrounds(places: Playground[], user?: LatLng | null): Playground[]`
  - `isStrollerFriendly(place: Playground): boolean`
  - `listPlaceDecisionTags(place: Playground): string[]` — 免費／室內／推車友善／年齡，有才加

- [ ] **Step 1: Write failing tests** in `lib/playground-distance.test.ts`

```ts
import { describe, expect, test } from "vitest";
import type { Playground } from "@/data/playgrounds";
import {
  estimateDriveMinutes,
  formatDriveMinutesLabel,
  haversineKm,
  isStrollerFriendly,
  listPlaceDecisionTags,
  sortPlaygrounds,
} from "@/lib/playground-distance";

describe("haversineKm", () => {
  test("同一點距離為 0", () => {
    expect(haversineKm({ lat: 25, lng: 121 }, { lat: 25, lng: 121 })).toBe(0);
  });
  test("台北到桃園大約 20–40 km", () => {
    const km = haversineKm(
      { lat: 25.04, lng: 121.55 },
      { lat: 25.0, lng: 121.3 },
    );
    expect(km).toBeGreaterThan(20);
    expect(km).toBeLessThan(40);
  });
});

describe("estimateDriveMinutes", () => {
  test("clamp 到 1–90", () => {
    expect(estimateDriveMinutes(0)).toBe(1);
    expect(estimateDriveMinutes(0.1)).toBe(1);
    expect(estimateDriveMinutes(100)).toBe(90);
  });
});

describe("formatDriveMinutesLabel", () => {
  test("繁中文案", () => {
    expect(formatDriveMinutesLabel(18)).toBe("約 18 分鐘");
  });
});

describe("sortPlaygrounds", () => {
  const base = {
    district: "區",
    lat: 0,
    lng: 0,
    address: "x",
    type: "公園" as const,
    ageRange: [3, 8] as [number, number],
    indoor: false,
    facilities: [] as string[],
    tags: [] as string[],
    sources: [],
    lastVerified: "2026-01-01",
  };

  test("無定位：免費優先再依名稱", () => {
    const places = [
      { ...base, id: "b", name: "乙園", city: "台北市", free: false, lat: 1, lng: 1 },
      { ...base, id: "a", name: "甲園", city: "台北市", free: true, lat: 2, lng: 2 },
      { ...base, id: "c", name: "丙園", city: "台北市", free: true, lat: 3, lng: 3 },
    ] as Playground[];
    expect(sortPlaygrounds(places, null).map((p) => p.id)).toEqual([
      "a",
      "c",
      "b",
    ]);
  });

  test("有定位：近到遠", () => {
    const user = { lat: 0, lng: 0 };
    const places = [
      { ...base, id: "far", name: "遠", city: "台北市", free: true, lat: 1, lng: 1 },
      { ...base, id: "near", name: "近", city: "台北市", free: false, lat: 0.01, lng: 0.01 },
    ] as Playground[];
    expect(sortPlaygrounds(places, user).map((p) => p.id)).toEqual([
      "near",
      "far",
    ]);
  });
});

describe("isStrollerFriendly", () => {
  test("推車友善正面才 true", () => {
    expect(
      isStrollerFriendly({
        tags: ["推車友善"],
        facilities: [],
        tips: undefined,
      } as Playground),
    ).toBe(true);
    expect(
      isStrollerFriendly({
        tags: [],
        facilities: [],
        tips: "推車慎選路線",
      } as Playground),
    ).toBe(false);
  });
});

describe("listPlaceDecisionTags", () => {
  test("只輸出有資料的標籤", () => {
    const tags = listPlaceDecisionTags({
      free: true,
      indoor: true,
      ageRange: [3, 8],
      tags: ["推車友善"],
      facilities: [],
      tips: undefined,
    } as Playground);
    expect(tags).toEqual(["免費", "室內", "推車友善", "3–8 歲"]);
  });
});
```

- [ ] **Step 2:** `npm test -- lib/playground-distance.test.ts` → FAIL（模組不存在）
- [ ] **Step 3:** 實作 `lib/playground-distance.ts` 通過測試
- [ ] **Step 4:** Commit `feat(lib): play-map distance sort and decision tags`

---

### Task 2: Query contract `city: null`

**Files:**
- Modify: `lib/playgrounds-query.ts`
- Modify: `lib/playgrounds-query.test.ts`

**Interfaces:**
- `PlayMapQuery.city: string | null`
- `parsePlayMapQuery(params): PlayMapQuery` — 無／非法 city → `null`（移除 defaultCity 缺省填入）
- `buildPlayMapQueryString(query): string` — `city` 有值才寫入；不再用 defaultCity 省略

- [ ] **Step 1:** 改測試：無參數／非法 city → `city: null`；台北市也會寫入 `city=`；對稱性保留
- [ ] **Step 2:** 跑測確認 RED
- [ ] **Step 3:** 改 `parse`／`build` 簽名與實作（可保留 optional 第二參數但忽略，或刪除並更新所有呼叫點）
- [ ] **Step 4:** Commit `fix(lib): play-map query city optional null`

---

### Task 3: PlayMap UI — intents, sticky filters, cards, sheet

**Files:**
- Modify: `components/for-parents/PlayMap.tsx`
- Modify: `components/for-parents/PlayMap.module.css`
- Modify: `components/for-parents/PlayMap.test.tsx`
- Modify: `app/for-parents/play-map/page.tsx`

**Behavior checklist (tests first in PlayMap.test.tsx):**
1. 預設「全部」縣市 pressed（非台北）
2. 可見意圖「離我最近／免費放電／室內／主題樂園」
3. 點免費放電 → freeOnly；點主題樂園 → type
4. 類型 count=0 的 chip 不在 document（已選例外另測）
5. 摘要列可展開篩選（手機預設收合以 CSS／狀態；測試可點「篩選」）
6. 卡片顯示年齡標籤；無 muted「需購票／戶外」
7. 地圖選點 → compact sheet（無 Tips）；「更多」→ full
8. 卡片選點 → full sheet

**UI notes:**
- `city: string | null` state；「全部」chip
- `userLatLng` + `geoStatus: idle|pending|ready|denied`
- 意圖列 2×2／桌面 1×4
- sticky `.filtersSticky`；室內／免費從獨立 chipGroup 移入意圖（進階列可移除重複）
- `filtered` = filter then `sortPlaygrounds`
- SSR 仍 map `allPlaces` + `hidden`；**可見順序**用排序後 id 對 `order` 或改為：可見列表按 sorted 渲染、hidden 其餘仍掛 DOM（兩段 ul 或單一 ul 先 sorted matched 再 unmatched hidden）
- Sheet `variant` + `onExpand`

- [ ] **Step 1:** 更新／新增失敗的 `PlayMap.test.tsx`
- [ ] **Step 2:** 實作 TSX／CSS／page.tsx
- [ ] **Step 3:** `npm test -- components/for-parents/PlayMap.test.tsx lib/playgrounds-query.test.ts lib/playground-distance.test.ts`
- [ ] **Step 4:** Commit `feat(for-parents): play-map intent-first UI`

---

### Task 4: Docs, e2e, gates, TODOS

**Files:**
- Modify: `e2e/play-map.spec.ts`
- Modify: `docs/PLAY-MAP-EDITORIAL.md`
- Modify: `TODOS.md`

- [ ] 更新 e2e：`waitForPlayMapReady` 找意圖或摘要；不假設預設台北；可測「全部」與意圖
- [ ] Editorial：篩選面改為意圖＋可收合縣市／類型；預設不鎖縣市
- [ ] `npm test`、`npm run build`、`npx tsc --noEmit`
- [ ] TODOS 完成列 + hash
- [ ] Commit `test(for-parents): play-map intent e2e and docs`

---

## Spec coverage

| Spec | Task |
|---|---|
| 意圖 4 chips／geolocation | 3 |
| city null／URL | 2 |
| 距離排序／約 X 分鐘 | 1+3 |
| 免費優先排序 | 1 |
| 類型隱藏 0 | 3 |
| sticky 收合 | 3 |
| 卡片層級／推車 | 1+3 |
| compact sheet | 3 |
| SEO hidden | 3 |
| editorial／TODOS／gates | 4 |
