import { describe, expect, it } from "vitest";
import {
  emptyDayFlags,
  flagsForDay,
  isDayCleared,
  isDayPlayable,
  isDayUnlocked,
  normalizeDayFlags,
  suggestedDay,
} from "./day-progress";
import { buildDayRound, DAY_CARDS } from "./days";
import { buildOrders, buildTray } from "./orders";
import { toppingById, type ToppingId } from "./toppings";
import { roundVariety } from "./variety";

function samePlate(
  a: { base: string; toppings: readonly string[] },
  b: { base: string; toppings: readonly string[] },
): boolean {
  return (
    a.base === b.base &&
    a.toppings.length === b.toppings.length &&
    a.toppings.every((id) => b.toppings.includes(id))
  );
}

function savoryOnly(ids: readonly ToppingId[]): boolean {
  return ids.every((id) => toppingById(id).kind === "savory");
}

describe("八天開店", () => {
  it("臉上是八天，名字照順序", () => {
    expect(DAY_CARDS.map((card) => card.name)).toEqual(["小紅", "安安", "鈴鈴", "多多", "香香", "東東", "阿樂", "大家"]);
  });

  it("第 4 天跟現在的一般檔是同一盤、同一串訂單", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const tray = buildTray(seed);
      const day = buildDayRound(4, seed);
      expect(day.tray).toEqual(tray);
      expect(day.orders).toEqual(buildOrders(seed, tray, "normal"));
      expect(day.variety).toEqual(roundVariety(seed));
      expect(day.allowedBases).toEqual(["nigiri", "gunkan", "temaki"]);
      expect(day.orders.map((order) => order.toppings.length)).toEqual([1, 1, 2, 2, 3]);
    }
  });

  it("第 1 天只有握壽司，料數 1、1、1、1、2，小紅坐第一單", () => {
    for (let seed = 1; seed <= 30; seed++) {
      const day = buildDayRound(1, seed);
      expect(day.allowedBases).toEqual(["nigiri"]);
      expect(day.tray).toHaveLength(8);
      expect(day.orders).toHaveLength(5);
      expect(day.orders.map((order) => order.toppings.length)).toEqual([1, 1, 1, 1, 2]);
      expect(day.orders.every((order) => order.base === "nigiri")).toBe(true);
      expect(day.orders.every((order) => savoryOnly(order.toppings))).toBe(true);
      expect(day.orders.every((order) => order.toppings.length <= 3)).toBe(true);
      expect(day.orders[0]!.customerId).toBe("xiaohong");
      expect(day.variety.seats[0]).toBe("xiaohong");
      expect(day.variety.visitors).not.toContain("dongdong");
      expect(day.variety.showTheme).toBe(false);
      expect(day.orders.map((order) => order.customerId)).toEqual([...day.variety.seats]);
      for (let i = 1; i < day.orders.length; i++) {
        expect(samePlate(day.orders[i - 1]!, day.orders[i]!)).toBe(false);
      }
    }
  });

  it("第 2 天只有握壽司和軍艦，每單都有綠色料", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const day = buildDayRound(2, seed);
      expect(day.allowedBases).toEqual(["nigiri", "gunkan"]);
      expect(day.orders.map((order) => order.toppings.length)).toEqual([1, 1, 1, 2, 2]);
      expect(day.orders.every((order) => order.base === "nigiri" || order.base === "gunkan")).toBe(true);
      expect(day.orders.every((order) => order.toppings.some((id) => id === "cucumber" || id === "avocado"))).toBe(true);
      expect(day.variety.seats[0]).toBe("anan");
      expect(day.variety.seats[1]).toBe("lingling");
      expect(day.variety.visitors).not.toContain("dongdong");
      expect(day.variety.sky).toBe("sunny");
      for (let i = 1; i < day.orders.length; i++) {
        expect(samePlate(day.orders[i - 1]!, day.orders[i]!)).toBe(false);
      }
    }
  });

  it("第 3 天三種飯都有，鈴鈴有位子，傍晚粉燈籠", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const day = buildDayRound(3, seed);
      expect(day.allowedBases).toEqual(["nigiri", "gunkan", "temaki"]);
      expect(day.orders.map((order) => order.toppings.length)).toEqual([1, 1, 2, 2, 2]);
      expect(day.variety.seats).toContain("lingling");
      expect(day.variety.visitors.length === 3 || day.variety.visitors.length === 4).toBe(true);
      expect(day.variety.sky).toBe("evening");
      expect(day.variety.lantern).toBe("pink");
      expect(day.orders.every((order) => savoryOnly(order.toppings))).toBe(true);
      for (let i = 1; i < day.orders.length; i++) {
        expect(samePlate(day.orders[i - 1]!, day.orders[i]!)).toBe(false);
      }
    }
  });
});

describe("八天進度", () => {
  it("舊存檔沒有欄位就是八個 0，壞掉的數字會被夾住", () => {
    expect(normalizeDayFlags(undefined)).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    expect(normalizeDayFlags([1, 9, -3, 2.8])).toEqual([1, 7, 0, 2, 0, 0, 0, 0]);
  });

  it("第 1 天一直開著；前一天通關才開下一天", () => {
    const days = emptyDayFlags();
    expect(isDayUnlocked(1, days, 0)).toBe(true);
    expect(isDayUnlocked(2, days, 0)).toBe(false);
    days[0] = 1;
    expect(isDayUnlocked(2, days, 0)).toBe(true);
    expect(isDayUnlocked(3, days, 0)).toBe(false);
    expect(suggestedDay(days, 0)).toBe(2);
  });

  it("舊的 3 星留在第 4 天，資料上開到第 5 天，但第 5 天還不能玩", () => {
    const days = emptyDayFlags();
    expect(flagsForDay(4, days, 7)).toBe(7);
    expect(isDayCleared(flagsForDay(4, days, 7))).toBe(true);
    expect(isDayUnlocked(4, days, 1)).toBe(true);
    expect(isDayUnlocked(5, days, 1)).toBe(true);
    expect(isDayUnlocked(6, days, 1)).toBe(false);
    expect(isDayPlayable(5)).toBe(false);
    expect(isDayPlayable(4)).toBe(true);
    expect(suggestedDay(days, 7)).toBe(1);
  });

  it("第 1–4 天都通關就再玩第 4 天", () => {
    expect(suggestedDay([1, 1, 1, 0, 0, 0, 0, 0], 1)).toBe(4);
    expect(suggestedDay([1, 1, 1, 0, 0, 0, 0, 0], 7)).toBe(4);
  });
});
