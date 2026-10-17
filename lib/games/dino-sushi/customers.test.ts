import { describe, expect, it } from "vitest";
import rawCharacters from "@/data/characters.json";
import { toppingById } from "./toppings";
import { CUSTOMERS, customerById, type CustomerId } from "./customers";

const roster = rawCharacters as Array<{ name: string; aliases?: string[]; ref: string }>;

describe("壽司屋客人", () => {
  it("六位都對得上角色名冊的短名與定裝照", () => {
    expect(CUSTOMERS).toHaveLength(6);
    for (const customer of CUSTOMERS) {
      const source = roster.find((item) => item.name === customer.fullName);
      expect(source, customer.fullName).toBeDefined();
      expect(source?.aliases ?? []).toContain(customer.name);
      expect(customer.avatar).toBe(`/${source!.ref}`);
      expect(customer.sticker).toBe(`/games/v2/dino-sushi/customers/sm/${customer.id}.webp`);
      expect(customer.greeting.includes(customer.name)).toBe(true);
      expect(customer.greeting.endsWith("。")).toBe(true);
      expect(customer.thanks.endsWith("！")).toBe(true);
      expect(`${customer.greeting}${customer.thanks}`).not.toMatch(/草莓|布丁|芥末/);
      expect(customer.favorites.length).toBeGreaterThan(0);
      for (const id of customer.favorites) {
        expect(toppingById(id).kind).toBe("savory");
      }
    }
  });

  it("不認識的 id 會丟錯", () => {
    expect(customerById("xiangxiang").name).toBe("香香");
    expect(() => customerById("duoduo" as CustomerId)).toThrow(/unknown customer/);
  });
});
