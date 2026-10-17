import { describe, expect, it } from "vitest";
import { seededRng } from "@/lib/games/candy-match/rng";
import { customerById } from "./customers";
import { TIER_SIZES, type OrderTier } from "./difficulty";
import { roundVariety } from "./variety";
import {
  buildOrders,
  buildTray,
  chooseToppings,
  matchOrder,
  orderAnnouncement,
  orderChecks,
  orderSpeechLine,
  orderThanksLine,
  ORDER_SIZES,
  ORDERS_PER_ROUND,
  TRAY_SIZE,
  type Order,
} from "./orders";
import { changeBase, addTopping, EMPTY_SUSHI, type Sushi } from "./sushi";
import { toppingById, type ToppingId } from "./toppings";

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

  it("訂單只點托盤上的家常料，同一單料不重複；相鄰兩單的飯和料不一樣", () => {
    for (let seed = 1; seed <= 60; seed++) {
      const tray = buildTray(seed);
      const orders = buildOrders(seed, tray);
      const variety = roundVariety(seed);
      expect(orders.map((o) => o.customerId)).toEqual(variety.seats);
      expect(variety.theme.toppings.every((id) => tray.includes(id))).toBe(true);
      for (const o of orders) {
        expect(o.toppings.some((id) => variety.theme.toppings.includes(id))).toBe(true);
        expect(new Set(o.toppings).size).toBe(o.toppings.length);
        for (const t of o.toppings) {
          expect(tray).toContain(t);
          expect(toppingById(t).kind).toBe("savory");
          expect(t).not.toBe("strawberry");
          expect(t).not.toBe("pudding");
          expect(t).not.toBe("wasabi");
        }
      }
      for (let i = 1; i < orders.length; i++) {
        const prev = orders[i - 1]!;
        const curr = orders[i]!;
        const same =
          prev.base === curr.base &&
          prev.toppings.length === curr.toppings.length &&
          prev.toppings.every((id) => curr.toppings.includes(id));
        expect(same).toBe(false);
      }
    }
  });

  it("兩樣以上的單，托盤上有最愛就會點到", () => {
    let hits = 0;
    let chances = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const tray = buildTray(seed);
      for (const order of buildOrders(seed, tray)) {
        if (order.toppings.length < 2) continue;
        const fav = customerById(order.customerId).favorites.filter((id) => tray.includes(id));
        if (fav.length === 0) continue;
        chances += 1;
        if (order.toppings.some((id) => fav.includes(id))) hits += 1;
      }
    }
    expect(chances).toBeGreaterThan(0);
    expect(hits / chances).toBeGreaterThan(0.9);
  });

  it("同 seed 訂單決定性", () => {
    expect(buildOrders(11, buildTray(11))).toEqual(buildOrders(11, buildTray(11)));
  });

  it("seed 7 仍有手捲（泡泡溢出測試用這個種子）", () => {
    expect(buildOrders(7, buildTray(7)).some((order) => order.base === "temaki")).toBe(true);
  });
});

describe("客人想吃的料", () => {
  it("先拿托盤上的最愛，不夠再補別的家常料", () => {
    const pool: ToppingId[] = ["shrimp", "corn", "salmon", "cucumber"];
    const picked = chooseToppings(["corn", "tamago"], pool, 2, seededRng(3));
    expect(picked).toHaveLength(2);
    expect(picked).toContain("corn");
    expect(picked.every((id) => pool.includes(id))).toBe(true);
    expect(new Set(picked).size).toBe(2);
  });

  it("最愛不在托盤上就改點別的家常料", () => {
    const picked = chooseToppings(["corn"], ["shrimp", "salmon"], 1, seededRng(1));
    expect(picked).toHaveLength(1);
    expect(["shrimp", "salmon"]).toContain(picked[0]);
  });
});

describe("比對訂單", () => {
  const order: Order = { base: "temaki", toppings: ["tamago", "cucumber"], customerId: "anan" };

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

  it("讀屏宣告用客人名字、飯型與料名", () => {
    expect(orderAnnouncement(order)).toBe("安安想吃：手捲、玉子、小黃瓜");
  });

  it("朗讀先報名字，再把料名和飯型編成一句", () => {
    expect(orderSpeechLine({ base: "nigiri", toppings: ["salmon", "tamago"], customerId: "xiaohong" })).toBe(
      "嗨，我是小紅。我想要鮭魚和玉子握壽司。",
    );
    expect(orderSpeechLine({ base: "temaki", toppings: ["crab"], customerId: "dongdong" })).toBe(
      "挖，我是東東。我想要蟹肉棒手捲。",
    );
    expect(orderSpeechLine({ base: "gunkan", toppings: ["salmon", "tamago", "cucumber"], customerId: "xiangxiang" })).toBe(
      "你好，我是香香。我想要鮭魚、玉子和小黃瓜軍艦。",
    );
    expect(orderSpeechLine(order)).toBe("你好，我是安安。我想要玉子和小黃瓜手捲。");
    expect(orderSpeechLine(order, "今天是綠色日。")).toBe(
      "今天是綠色日。你好，我是安安。我想要玉子和小黃瓜手捲。",
    );
  });

  it("做對時念朋友的那一句，不把甜點或芥末說成點餐", () => {
    expect(orderThanksLine(order)).toBe("謝謝你，好健康喔！");
    expect(orderThanksLine({ base: "nigiri", toppings: ["shrimp"], customerId: "xiaohong" })).toBe("咻～好快好好吃！");
    expect(orderThanksLine({ base: "nigiri", toppings: ["salmon"], customerId: "xiangxiang" })).not.toMatch(/草莓|布丁|芥末/);
  });
});

describe("難度檔位的訂單", () => {
  /** FNV-1a：一般檔 seed 1–100 的訂單在加檔位之前的指紋。變了＝視覺基準與 e2e 的訂單會跟著變。 */
  function fingerprint(tier?: OrderTier): string {
    let h = 0x811c9dc5;
    const text = Array.from({ length: 100 }, (_, i) =>
      JSON.stringify(tier ? buildOrders(i + 1, buildTray(i + 1), tier) : buildOrders(i + 1, buildTray(i + 1))),
    ).join("|");
    for (let k = 0; k < text.length; k++) {
      h ^= text.charCodeAt(k);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(16);
  }

  it("一般檔（預設）跟加檔位之前一模一樣", () => {
    expect(fingerprint()).toBe("9662f9d8");
    expect(fingerprint("normal")).toBe("9662f9d8");
  });

  /* 三檔各 1000 個 seed（2026-10-17 另外掃過各 5000 個，相鄰重複 0 次） */
  it.each(["easy", "normal", "advanced"] as const)("%s：料數照檔位、同 seed 決定性、相鄰兩單不同、只點托盤上的家常料", (tier) => {
    for (let seed = 1; seed <= 1000; seed++) {
      const tray = buildTray(seed);
      const orders = buildOrders(seed, tray, tier);
      expect(orders.map((o) => o.toppings.length)).toEqual(TIER_SIZES[tier]);
      expect(buildOrders(seed, tray, tier)).toEqual(orders);
      for (const o of orders) {
        expect(new Set(o.toppings).size).toBe(o.toppings.length);
        for (const id of o.toppings) {
          expect(tray).toContain(id);
          expect(toppingById(id).kind).toBe("savory");
        }
      }
      for (let i = 1; i < orders.length; i++) {
        const [a, b] = [orders[i - 1]!, orders[i]!];
        const same = a.base === b.base && a.toppings.length === b.toppings.length && a.toppings.every((t) => b.toppings.includes(t));
        expect(same, `seed ${seed} 第 ${i} 單`).toBe(false);
      }
    }
  });
});
