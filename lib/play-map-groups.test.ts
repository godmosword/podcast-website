import { describe, expect, it } from "vitest";
import { PLAYGROUND_TYPES, type Playground, type PlaygroundType } from "@/data/playgrounds";
import type { LatLng } from "@/lib/playground-distance";
import {
  DRIVE_GROUP_NOTE,
  groupPlayMapResults,
  resolvePlayMapGroupMode,
} from "./play-map-groups";

const USER: LatLng = { lat: 25, lng: 121 };
const EARTH_RADIUS_KM = 6371;
const MINUTES_PER_KM = 2.8;

/** 正北方向、剛好落在指定車程分鐘數的座標（haversine 在同經度時退化為弧長）。 */
function latAtMinutes(minutes: number): number {
  const km = minutes / MINUTES_PER_KM;
  return USER.lat + (km / EARTH_RADIUS_KM) * (180 / Math.PI);
}

function place(
  overrides: Partial<Playground> & Pick<Playground, "id">,
): Playground {
  return {
    name: overrides.id,
    city: "桃園市",
    lat: USER.lat,
    lng: USER.lng,
    address: "測試地址",
    type: "公園",
    ageRange: [3, 8],
    free: true,
    indoor: false,
    facilities: [],
    tags: [],
    tips: "測試備註",
    sources: [{ kind: "gov", name: "測試", url: "https://example.com" }],
    lastVerified: "2026-08-01",
    ...overrides,
  };
}

describe("resolvePlayMapGroupMode", () => {
  it("有定位時優先用車程分組，即使已選縣市", () => {
    expect(resolvePlayMapGroupMode({ hasLocation: true, city: null })).toBe("drive");
    expect(resolvePlayMapGroupMode({ hasLocation: true, city: "桃園市" })).toBe("drive");
  });

  it("沒定位且未選縣市用縣市分組", () => {
    expect(resolvePlayMapGroupMode({ hasLocation: false, city: null })).toBe("city");
  });

  it("沒定位但已選縣市改用類型分組", () => {
    expect(resolvePlayMapGroupMode({ hasLocation: false, city: "桃園市" })).toBe("type");
  });
});

describe("groupPlayMapResults：車程分組", () => {
  const places = [
    place({ id: "a", lat: latAtMinutes(5) }),
    place({ id: "b", lat: latAtMinutes(20) }),
    place({ id: "c", lat: latAtMinutes(21) }),
    place({ id: "d", lat: latAtMinutes(40) }),
    place({ id: "e", lat: latAtMinutes(41) }),
    place({ id: "f", lat: latAtMinutes(60) }),
    place({ id: "g", lat: latAtMinutes(61) }),
  ];

  it("20／40／60 分邊界歸屬在前一帶，不外溢", () => {
    const groups = groupPlayMapResults({
      places,
      mode: "drive",
      userLatLng: USER,
    });
    const byKey = new Map(
      groups.map((group) => [group.key, group.items.map((item) => item.place.id)]),
    );
    expect(byKey.get("d20")).toEqual(["a", "b"]);
    expect(byKey.get("d40")).toEqual(["c", "d"]);
    expect(byKey.get("d60")).toEqual(["e", "f"]);
    expect(byKey.get("d61")).toEqual(["g"]);
  });

  it("label 與 count 分開輸出，count 不受遮蔽影響", () => {
    const groups = groupPlayMapResults({
      places,
      mode: "drive",
      userLatLng: USER,
    });
    expect(groups[0]!.label).toBe("20 分鐘內");
    expect(groups[0]!.count).toBe(2);
  });

  it("60 分鐘以上不寫上限數字，避免 90 分 clamp 讀成剛好 90 分", () => {
    const groups = groupPlayMapResults({
      places,
      mode: "drive",
      userLatLng: USER,
    });
    const last = groups[groups.length - 1]!;
    expect(last.label).toBe("60 分鐘以上");
    expect(last.label).not.toMatch(/90/);
  });

  it("空組被略過，不渲染「40–60 分鐘 · 0 個」", () => {
    const groups = groupPlayMapResults({
      places: [place({ id: "a", lat: latAtMinutes(5) })],
      mode: "drive",
      userLatLng: USER,
    });
    expect(groups).toHaveLength(1);
    expect(groups[0]!.key).toBe("d20");
  });

  it("宣告 drive 卻沒有定位時退回縣市分組，不編造距離", () => {
    const groups = groupPlayMapResults({
      places: [place({ id: "a", city: "台北市" }), place({ id: "b", city: "桃園市" })],
      mode: "drive",
      userLatLng: null,
    });
    expect(groups.map((group) => group.key)).toEqual(["台北市", "桃園市"]);
  });

  it("車程免責文案講明是粗估，且不承諾路況", () => {
    expect(DRIVE_GROUP_NOTE).toContain("粗估");
    expect(DRIVE_GROUP_NOTE).toContain("不含即時路況");
  });
});

describe("groupPlayMapResults：縣市與類型分組", () => {
  it("縣市分組依北到南，不用字典序", () => {
    const groups = groupPlayMapResults({
      places: [
        place({ id: "a", city: "高雄市" }),
        place({ id: "b", city: "台北市" }),
        place({ id: "c", city: "台中市" }),
      ],
      mode: "city",
      userLatLng: null,
    });
    expect(groups.map((group) => group.key)).toEqual(["台北市", "台中市", "高雄市"]);
  });

  it("類型分組沿用 PLAYGROUND_TYPES 順序", () => {
    const types: PlaygroundType[] = ["農場", "公園", "博物館"];
    const groups = groupPlayMapResults({
      places: types.map((type, index) => place({ id: `p${index}`, type })),
      mode: "type",
      userLatLng: null,
    });
    const expected = PLAYGROUND_TYPES.filter((type) => types.includes(type));
    expect(groups.map((group) => group.key)).toEqual([...expected]);
  });

  it("不在順序表內的鍵退到最後，依首次出現排序", () => {
    const groups = groupPlayMapResults({
      places: [place({ id: "a", city: "火星市" }), place({ id: "b", city: "台北市" })],
      mode: "city",
      userLatLng: null,
    });
    expect(groups.map((group) => group.key)).toEqual(["台北市", "火星市"]);
  });
});

describe("groupPlayMapResults：displayIndex 與不可變性", () => {
  it("displayIndex 從 0 起連續，且與組顯示順序一致", () => {
    const groups = groupPlayMapResults({
      places: [
        place({ id: "a", city: "高雄市" }),
        place({ id: "b", city: "台北市" }),
        place({ id: "c", city: "台北市" }),
      ],
      mode: "city",
      userLatLng: null,
    });
    const flat = groups.flatMap((group) => group.items);
    expect(flat.map((item) => item.displayIndex)).toEqual([0, 1, 2]);
    expect(flat.map((item) => item.place.id)).toEqual(["b", "c", "a"]);
  });

  it("組內維持傳入順序，分組只切段不重排", () => {
    const groups = groupPlayMapResults({
      places: [
        place({ id: "b", city: "台北市" }),
        place({ id: "a", city: "台北市" }),
      ],
      mode: "city",
      userLatLng: null,
    });
    expect(groups[0]!.items.map((item) => item.place.id)).toEqual(["b", "a"]);
  });

  it("不 mutate 傳入陣列", () => {
    const places = [
      place({ id: "a", city: "高雄市" }),
      place({ id: "b", city: "台北市" }),
    ];
    const snapshot = places.map((item) => item.id);
    groupPlayMapResults({ places, mode: "city", userLatLng: null });
    expect(places.map((item) => item.id)).toEqual(snapshot);
  });

  it("空輸入回傳空陣列", () => {
    expect(
      groupPlayMapResults({ places: [], mode: "city", userLatLng: null }),
    ).toEqual([]);
  });
});
