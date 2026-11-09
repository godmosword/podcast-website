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
  it("只排還沒輪到的人：下一位放大、後面的小貼紙，不能點", () => {
    render(<DinoSushiCustomerQueue seats={seats} index={2} />);
    const queue = document.querySelector("[data-customer-queue]");
    expect(queue?.getAttribute("aria-hidden")).toBe("true");
    const items = [...(queue?.querySelectorAll("li") ?? [])];
    expect(items).toHaveLength(2);
    expect(items.map((item) => item.getAttribute("data-state"))).toEqual(["next", "wait"]);
    expect(items.map((item) => item.getAttribute("data-customer"))).toEqual(["ale", "lingling"]);
    for (const item of items) {
      const id = item.getAttribute("data-customer") as CustomerId;
      expect(item.querySelector("img")?.getAttribute("src")).toBe(customerById(id).sticker);
      expect(item.querySelector("svg")).toBeNull();
    }
    expect(queue?.querySelector("button")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("坐著或正在吃的這位，以及做完的人，都不在可見的排隊裡", () => {
    for (const index of [0, 1, 2, 3, 4]) {
      const { unmount } = render(
        <>
          <DinoSushiCustomerQueue seats={seats} index={index} />
          <DinoSushiCustomerSeat
            order={{ base: "nigiri", toppings: ["shrimp", "cucumber"], customerId: seats[index]! }}
            phase="idle"
            mood={null}
            reducedMotion={false}
          />
        </>,
      );
      const seated = document.querySelector("[data-customer-seat]")?.getAttribute("data-customer");
      const queued = [...document.querySelectorAll("[data-customer-queue] li")].map((item) =>
        item.getAttribute("data-customer"),
      );
      expect(seated).toBe(seats[index]);
      expect(queued).not.toContain(seated);
      expect(queued).toEqual(seats.slice(index + 1));
      for (const done of seats.slice(0, index)) expect(queued).not.toContain(done);
      unmount();
    }
  });

  it("最後一單沒有人等，就不畫排隊", () => {
    render(<DinoSushiCustomerQueue seats={seats} index={4} />);
    expect(document.querySelector("[data-customer-queue]")).toBeNull();
  });
});

describe("客人座位", () => {
  const favoriteOrder = { base: "nigiri", toppings: ["shrimp", "cucumber"], customerId: "xiaohong" } as const;

  it("整單坐在櫃台：全身貼紙、不能點；還沒吃到時沒有愛心", () => {
    render(<DinoSushiCustomerSeat order={favoriteOrder} phase="idle" mood={null} reducedMotion={false} />);
    const seat = document.querySelector("[data-customer-seat]");
    expect(seat?.getAttribute("aria-hidden")).toBe("true");
    expect(seat?.getAttribute("data-customer")).toBe("xiaohong");
    expect(seat?.querySelector("img")?.getAttribute("src")).toBe(customerById("xiaohong").sticker);
    expect(seat?.querySelectorAll("svg")).toHaveLength(0);
    expect(seat?.querySelector("button")).toBeNull();
  });

  it("吃到的那一拍冒愛心，有最愛的料再加星星", () => {
    render(<DinoSushiCustomerSeat order={favoriteOrder} phase="react" mood="love" reducedMotion={false} />);
    expect(document.querySelector("[data-customer-seat]")?.querySelectorAll("svg")).toHaveLength(3);
  });

  it("這單沒有最愛的料時只有愛心", () => {
    render(
      <DinoSushiCustomerSeat
        order={{ base: "nigiri", toppings: ["tuna"], customerId: "xiaohong" }}
        phase="react"
        mood="yum"
        reducedMotion={false}
      />,
    );
    expect(document.querySelector("[data-customer-seat]")?.querySelectorAll("svg")).toHaveLength(2);
  });

  it("芥末：搖一搖、冒小火，愛心照樣冒", () => {
    render(<DinoSushiCustomerSeat order={favoriteOrder} phase="react" mood="puff" reducedMotion={false} />);
    const seat = document.querySelector("[data-customer-seat]");
    expect(seat?.getAttribute("data-mood")).toBe("puff");
    expect(seat?.querySelectorAll("svg").length).toBeGreaterThanOrEqual(1);
  });

  it("沒吃（缺料只看泡泡）不冒愛心", () => {
    render(<DinoSushiCustomerSeat order={favoriteOrder} phase="react" mood="look" reducedMotion={false} />);
    expect(document.querySelector("[data-customer-seat]")?.querySelectorAll("svg")).toHaveLength(0);
  });
});
