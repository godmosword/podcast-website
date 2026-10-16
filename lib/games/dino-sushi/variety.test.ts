import { describe, expect, it } from "vitest";
import { CUSTOMERS, type CustomerId } from "./customers";
import { DINO_SUSHI_STICKER_IDS } from "./stickers";
import { buildOrders, buildTray, ORDERS_PER_ROUND } from "./orders";
import { toppingById } from "./toppings";
import {
  DOME_AFTER_PLATES,
  DOME_SPEECH,
  domeStickerId,
  orderLead,
  LANTERN_TONES,
  roundVariety,
  SKY_MOODS,
  THEME_DAYS,
  todayAnnouncement,
} from "./variety";

describe("每輪小變化", () => {
  it("同一個 seed 得到同一組客人、主題、天色和燈籠", () => {
    expect(roundVariety(7)).toEqual(roundVariety(7));
    expect(domeStickerId(7, ["topping-tamago", "base-nigiri"])).toBe(
      domeStickerId(7, ["topping-tamago", "base-nigiri"]),
    );
  });

  it("今天 3 到 5 位不重複，五個位子都是他們；人少就輪流", () => {
    const counts = new Set<number>();
    const themes = new Set<string>();
    const skies = new Set<string>();
    const lanterns = new Set<string>();
    const seen = new Set<CustomerId>();
    const missed = new Set<CustomerId>();
    for (let seed = 1; seed <= 80; seed++) {
      const variety = roundVariety(seed);
      expect(variety.visitors.length).toBeGreaterThanOrEqual(3);
      expect(variety.visitors.length).toBeLessThanOrEqual(5);
      expect(new Set(variety.visitors).size).toBe(variety.visitors.length);
      expect(variety.seats).toHaveLength(ORDERS_PER_ROUND);
      expect(variety.seats[0]).not.toBe(variety.seats[1]);
      for (const id of variety.seats) expect(variety.visitors).toContain(id);
      if (variety.visitors.includes("xiaohong")) {
        expect([variety.seats[0], variety.seats[1]]).toContain("xiaohong");
      }
      if (variety.visitors.includes("dongdong")) {
        expect(variety.seats[4]).toBe("dongdong");
        expect(variety.seats.slice(0, 4)).not.toContain("dongdong");
      }
      counts.add(variety.visitors.length);
      themes.add(variety.theme.id);
      skies.add(variety.sky);
      lanterns.add(variety.lantern);
      for (const id of variety.visitors) seen.add(id);
      for (const customer of CUSTOMERS) {
        if (!variety.visitors.includes(customer.id)) missed.add(customer.id);
      }
    }
    expect(counts).toEqual(new Set([3, 4, 5]));
    expect(themes).toEqual(new Set(THEME_DAYS.map((theme) => theme.id)));
    expect(skies).toEqual(new Set(SKY_MOODS));
    expect(lanterns).toEqual(new Set(LANTERN_TONES));
    expect(seen).toEqual(new Set(CUSTOMERS.map((customer) => customer.id)));
    expect(missed).toEqual(seen);
  });

  it("主題日只用熟食，標題那句報主題和今天會來的名字", () => {
    for (const theme of THEME_DAYS) {
      expect(theme.label.startsWith("今天是")).toBe(true);
      expect(theme.toppings.length).toBeGreaterThan(0);
      for (const id of theme.toppings) expect(toppingById(id).kind).toBe("savory");
      expect(`${theme.label}${theme.name}`).not.toMatch(/草莓|布丁|芥末/);
    }
    const line = todayAnnouncement(roundVariety(4));
    expect(line.startsWith(roundVariety(4).theme.label)).toBe(true);
    expect(line).toContain("今天會來");
    for (const id of roundVariety(4).visitors) {
      expect(line).toContain(CUSTOMERS.find((customer) => customer.id === id)!.name);
    }
    expect(line).not.toMatch(/草莓|布丁|芥末/);
    const variety = roundVariety(4);
    expect(orderLead(0, variety)).toBe(`${variety.theme.label}。`);
    expect(orderLead(DOME_AFTER_PLATES, variety)).toBe(DOME_SPEECH);
    expect(orderLead(1, variety)).toBe("");
    expect(orderLead(0, variety)).not.toMatch(/草莓|布丁|芥末/);
  });

  it("托盤帶齊主題料，訂單仍是 5 單熟食、沒有第 6 單", () => {
    expect(DOME_AFTER_PLATES).toBe(3);
    for (let seed = 1; seed <= 40; seed++) {
      const tray = buildTray(seed);
      const orders = buildOrders(seed, tray);
      const theme = roundVariety(seed).theme.toppings;
      expect(orders).toHaveLength(5);
      expect(theme.every((id) => tray.includes(id))).toBe(true);
      expect(tray.filter((id) => toppingById(id).kind === "sweet")).toHaveLength(1);
      expect(tray).toContain("wasabi");
      for (const order of orders) {
        expect(order.toppings.some((id) => theme.includes(id))).toBe(true);
        expect(order.toppings.some((id) => toppingById(id).kind !== "savory")).toBe(false);
      }
    }
  });

  it("圓蓋只從已經拿到的貼紙裡挑，沒有就不給新的", () => {
    expect(DOME_SPEECH).toBe("哇，蓋子打開了！");
    expect(domeStickerId(3, [])).toBeNull();
    const owned = ["topping-tamago", "customer-xiaohong"];
    expect(owned).toContain(domeStickerId(3, owned));
    expect(DINO_SUSHI_STICKER_IDS).toContain(domeStickerId(9, [...DINO_SUSHI_STICKER_IDS, "not-a-sticker"]));
    expect(domeStickerId(9, ["not-a-sticker"])).toBeNull();
  });
});
