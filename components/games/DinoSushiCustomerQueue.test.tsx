// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { CustomerId } from "@/lib/games/dino-sushi/customers";
import { customerById } from "@/lib/games/dino-sushi/customers";
import { DinoSushiCustomerQueue } from "./DinoSushiCustomerQueue";
import { DinoSushiCustomerSeat } from "./DinoSushiCustomerSeat";

const seats: CustomerId[] = ["xiangxiang", "xiaohong", "anan", "ale", "lingling"];

afterEach(cleanup);

describe("門口排隊", () => {
  it("5 個位子：做完打勾、現在放大、還沒到的小貼紙，而且不能點", () => {
    render(<DinoSushiCustomerQueue seats={seats} index={2} />);
    const queue = document.querySelector("[data-customer-queue]");
    expect(queue?.getAttribute("aria-hidden")).toBe("true");
    const items = [...(queue?.querySelectorAll("li") ?? [])];
    expect(items).toHaveLength(5);
    expect(items.map((item) => item.getAttribute("data-state"))).toEqual(["done", "done", "now", "wait", "wait"]);
    expect(items.map((item) => item.getAttribute("data-customer"))).toEqual(seats);
    for (const [item, id] of items.map((item, i) => [item, seats[i]!] as const)) {
      expect(item.querySelector("img")?.getAttribute("src")).toBe(customerById(id).sticker);
    }
    expect(items[0]?.querySelector("svg")).not.toBeNull();
    expect(items[1]?.querySelector("svg")).not.toBeNull();
    expect(items[2]?.querySelector("svg")).toBeNull();
    expect(items[4]?.querySelector("svg")).toBeNull();
    expect(queue?.querySelector("button")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("客人座位", () => {
  it("吃的時候留著全身貼紙和愛心，有最愛的料再加星星，不能點", () => {
    render(
      <DinoSushiCustomerSeat order={{ base: "nigiri", toppings: ["shrimp", "cucumber"], customerId: "xiaohong" }} />,
    );
    const seat = document.querySelector("[data-customer-seat]");
    expect(seat?.getAttribute("aria-hidden")).toBe("true");
    expect(seat?.getAttribute("data-customer")).toBe("xiaohong");
    expect(seat?.querySelector("img")?.getAttribute("src")).toBe(customerById("xiaohong").sticker);
    expect(seat?.querySelectorAll("svg")).toHaveLength(2);
    expect(seat?.querySelector("button")).toBeNull();
  });

  it("這單沒有最愛的料時只有愛心", () => {
    render(<DinoSushiCustomerSeat order={{ base: "nigiri", toppings: ["tuna"], customerId: "xiaohong" }} />);
    expect(document.querySelector("[data-customer-seat]")?.querySelectorAll("svg")).toHaveLength(1);
  });
});
