import { describe, expect, it } from "vitest";
import { toppingById } from "./toppings";
import { changeBase, addTopping, EMPTY_SUSHI, type Sushi } from "./sushi";
import {
  buildOrders,
  buildTray,
  matchOrder,
  orderAnnouncement,
  orderChecks,
  ORDER_SIZES,
  ORDERS_PER_ROUND,
  TRAY_SIZE,
  type Order,
} from "./orders";

function make(base: Sushi["base"], toppings: Sushi["toppings"]): Sushi {
  return toppings.reduce((s, t) => addTopping(s, t), changeBase(EMPTY_SUSHI, base!));
}

describe("托盤", () => {
  it("每輪 8 格：6 種家常料＋1 種甜點＋芥末，不重複", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const tray = buildTray(seed);
      expect(tray).toHaveLength(TRAY_SIZE);
      expect(new Set(tray).size).toBe(TRAY_SIZE);
      const kinds = tray.map((id) => toppingById(id).kind);
      expect(kinds.filter((k) => k === "savory")).toHaveLength(6);
      expect(kinds.filter((k) => k === "sweet")).toHaveLength(1);
      expect(kinds.filter((k) => k === "wasabi")).toHaveLength(1);
    }
  });

  it("同 seed 結果相同；不同 seed 會輪替", () => {
    expect(buildTray(7)).toEqual(buildTray(7));
    const variants = new Set(Array.from({ length: 20 }, (_, i) => buildTray(i + 1).join(",")));
    expect(variants.size).toBeGreaterThan(5);
  });
});

describe("點餐", () => {
  it("一輪 5 單，由飯＋1 料漸增到飯＋3 料", () => {
    expect(ORDERS_PER_ROUND).toBe(5);
    expect(ORDER_SIZES).toEqual([1, 1, 2, 2, 3]);
    const tray = buildTray(3);
    const orders = buildOrders(3, tray);
    expect(orders.map((o) => o.toppings.length)).toEqual([...ORDER_SIZES]);
  });

  it("訂單只點托盤上的家常料，同一單料不重複；相鄰兩單不一樣", () => {
    for (let seed = 1; seed <= 60; seed++) {
      const tray = buildTray(seed);
      const orders = buildOrders(seed, tray);
      for (const o of orders) {
        expect(new Set(o.toppings).size).toBe(o.toppings.length);
        for (const t of o.toppings) {
          expect(tray).toContain(t);
          expect(toppingById(t).kind).toBe("savory");
        }
      }
      for (let i = 1; i < orders.length; i++) {
        expect(orders[i]).not.toEqual(orders[i - 1]);
      }
    }
  });

  it("同 seed 訂單決定性", () => {
    expect(buildOrders(11, buildTray(11))).toEqual(buildOrders(11, buildTray(11)));
  });
});

describe("比對訂單", () => {
  const order: Order = { base: "temaki", toppings: ["tamago", "cucumber"] };

  it("集合比對、順序無關", () => {
    expect(matchOrder(make("temaki", ["cucumber", "tamago"]), order)).toEqual({
      ok: true,
      baseOk: true,
      missing: [],
      extra: [],
    });
  });

  it("多放的料不算錯，但列在 extra", () => {
    const r = matchOrder(make("temaki", ["tamago", "cucumber", "strawberry"]), order);
    expect(r.ok).toBe(true);
    expect(r.extra).toEqual(["strawberry"]);
  });

  it("重複放同一種料不算多放", () => {
    const r = matchOrder(make("temaki", ["tamago", "tamago", "cucumber"]), order);
    expect(r).toMatchObject({ ok: true, extra: [] });
  });

  it("缺料或飯型不對都不算對，只列出還缺的", () => {
    expect(matchOrder(make("temaki", ["tamago"]), order)).toMatchObject({
      ok: false,
      baseOk: true,
      missing: ["cucumber"],
    });
    expect(matchOrder(make("nigiri", ["tamago", "cucumber"]), order)).toMatchObject({
      ok: false,
      baseOk: false,
      missing: [],
    });
  });

  it("泡泡逐項打勾", () => {
    expect(orderChecks(make("temaki", ["cucumber"]), order)).toEqual({
      base: true,
      toppings: [
        { id: "tamago", done: false },
        { id: "cucumber", done: true },
      ],
    });
    expect(orderChecks(EMPTY_SUSHI, order).base).toBe(false);
  });

  it("讀屏宣告用飯型＋料名", () => {
    expect(orderAnnouncement(order)).toBe("多多想吃：手捲、玉子、小黃瓜");
  });
});
