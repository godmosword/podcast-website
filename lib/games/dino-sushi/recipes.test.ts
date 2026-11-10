import { describe, expect, it } from "vitest";
import { DAY_SCRIPTS } from "./days";
import { fitsBase, RECIPES } from "./recipes";
import { SAVORY_TOPPINGS, toppingById } from "./toppings";

const key = (r: { base: string; toppings: readonly string[] }) => `${r.base}:${[...r.toppings].sort().join("+")}`;

describe("真實配方（2026-11-08 使用者回饋：搭配要符合真實口味）", () => {
  it("每道配方都是家常料、不重複；同一道不會出現兩次", () => {
    for (const recipe of RECIPES) {
      expect(recipe.toppings.length, key(recipe)).toBeGreaterThanOrEqual(1);
      expect(recipe.toppings.length, key(recipe)).toBeLessThanOrEqual(3);
      expect(new Set(recipe.toppings).size, key(recipe)).toBe(recipe.toppings.length);
      for (const id of recipe.toppings) expect(toppingById(id).kind, `${key(recipe)} ${id}`).toBe("savory");
    }
    expect(new Set(RECIPES.map(key)).size).toBe(RECIPES.length);
  });

  it("握壽司只放一兩樣：散的料（玉米、鮭魚卵、肉鬆、鮪魚沙拉）放不上握壽司，要用軍艦或手捲", () => {
    for (const id of ["corn", "ikura", "floss", "tuna"] as const) expect(fitsBase(id, "nigiri"), id).toBe(false);
    for (const recipe of RECIPES.filter((r) => r.base === "nigiri")) expect(recipe.toppings.length).toBeLessThanOrEqual(2);
  });

  it("每一樣家常料至少出現在一道配方裡（托盤上的料都有機會被點到）", () => {
    for (const topping of SAVORY_TOPPINGS) {
      expect(RECIPES.some((r) => r.toppings.includes(topping.id)), topping.id).toBe(true);
    }
  });

  it("每一天的每一單，在當天允許的飯型與料數裡至少有 3 道配方可挑", () => {
    for (const [day, script] of Object.entries(DAY_SCRIPTS)) {
      script.forEach((slot, index) => {
        const options = RECIPES.filter((r) => slot.bases.includes(r.base) && r.toppings.length === slot.size);
        expect(options.length, `第 ${day} 天第 ${index + 1} 單`).toBeGreaterThanOrEqual(3);
      });
    }
  });
});
