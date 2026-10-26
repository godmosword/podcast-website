import { describe, expect, it } from "vitest";
import { BASES, SAVORY_TOPPINGS, TOPPINGS, toppingById } from "./toppings";
import {
  addTopping,
  changeBase,
  EMPTY_SUSHI,
  isServable,
  MAX_TOPPINGS,
  removeTopping,
} from "./sushi";

describe("食材表", () => {
  it("三種飯型、12 種料，id 不重複", () => {
    expect(BASES.map((b) => b.id)).toEqual(["nigiri", "gunkan", "temaki"]);
    expect(TOPPINGS).toHaveLength(12);
    expect(new Set(TOPPINGS.map((t) => t.id)).size).toBe(12);
  });

  it("點餐只用熟食家常料：甜點與芥末不在 SAVORY_TOPPINGS", () => {
    expect(SAVORY_TOPPINGS.length).toBeGreaterThanOrEqual(6);
    for (const t of SAVORY_TOPPINGS) expect(t.kind).toBe("savory");
    expect(TOPPINGS.filter((t) => t.kind === "sweet").map((t) => t.id)).toEqual([
      "strawberry",
      "pudding",
    ]);
    expect(TOPPINGS.filter((t) => t.kind === "wasabi").map((t) => t.id)).toEqual(["wasabi"]);
  });

  it("toppingById 找得到每一種料", () => {
    for (const t of TOPPINGS) expect(toppingById(t.id).label).toBe(t.label);
  });
});

describe("組壽司", () => {
  it("先選飯才能加料；空砧板不能送出", () => {
    expect(isServable(EMPTY_SUSHI)).toBe(false);
    expect(addTopping(EMPTY_SUSHI, "tamago")).toBe(EMPTY_SUSHI);
    const rice = changeBase(EMPTY_SUSHI, "nigiri");
    expect(isServable(rice)).toBe(true);
  });

  it("最多 3 層；第 4 料擠掉最舊那層，飯不變", () => {
    let s = changeBase(EMPTY_SUSHI, "gunkan");
    s = addTopping(s, "tamago");
    s = addTopping(s, "shrimp");
    s = addTopping(s, "tamago");
    expect(s.toppings).toEqual(["tamago", "shrimp", "tamago"]);
    expect(MAX_TOPPINGS).toBe(3);
    const next = addTopping(s, "corn");
    expect(next.toppings).toEqual(["shrimp", "tamago", "corn"]);
    expect(next.base).toBe("gunkan");
    expect(s.toppings).toEqual(["tamago", "shrimp", "tamago"]);
  });

  it("每次放料給一個新的層編號；擠掉、拿掉時編號跟著那層走，留下來的不換號", () => {
    let s = changeBase(EMPTY_SUSHI, "nigiri");
    s = addTopping(addTopping(addTopping(s, "tamago"), "shrimp"), "tamago");
    expect(s.layerIds).toEqual([0, 1, 2]);
    // 滿了擠掉最舊的玉子（0）：留下來的蝦（1）和第二個玉子（2）不換號
    const evicted = addTopping(s, "corn");
    expect(evicted.toppings).toEqual(["shrimp", "tamago", "corn"]);
    expect(evicted.layerIds).toEqual([1, 2, 3]);
    // 拿掉第一個玉子：第二個玉子仍是 2，不會因為變成「第一個玉子」而換號
    const removed = removeTopping(s, 0);
    expect(removed.toppings).toEqual(["shrimp", "tamago"]);
    expect(removed.layerIds).toEqual([1, 2]);
    // 拿掉最新那層再放：新的編號不重用剛拿掉的那號
    expect(addTopping(removeTopping(s, 2), "corn").layerIds).toEqual([0, 1, 3]);
  });

  it("還沒選飯加料回傳同一物件（View 只讓料位輕晃）", () => {
    expect(addTopping(EMPTY_SUSHI, "corn")).toBe(EMPTY_SUSHI);
  });

  it("點料位拿掉那一層，其餘順序不變；越界不動", () => {
    let s = changeBase(EMPTY_SUSHI, "temaki");
    s = addTopping(addTopping(addTopping(s, "tamago"), "shrimp"), "corn");
    expect(removeTopping(s, 1).toppings).toEqual(["tamago", "corn"]);
    expect(removeTopping(s, 5)).toBe(s);
    expect(s.toppings).toHaveLength(3);
  });

  it("換飯型保留已放的料；選同一種飯回傳同一物件", () => {
    let s = changeBase(EMPTY_SUSHI, "nigiri");
    s = addTopping(s, "salmon");
    const changed = changeBase(s, "temaki");
    expect(changed).toMatchObject({ base: "temaki", toppings: ["salmon"], layerIds: [0] });
    expect(changeBase(changed, "temaki")).toBe(changed);
  });
});
