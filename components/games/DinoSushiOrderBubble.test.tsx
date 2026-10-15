// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { addTopping, changeBase, EMPTY_SUSHI } from "@/lib/games/dino-sushi/sushi";
import { DinoSushiOrderBubble } from "./DinoSushiOrderBubble";

const order = { base: "nigiri" as const, toppings: ["shrimp" as const], customerId: "xiaohong" as const };

afterEach(cleanup);

describe("點餐泡泡上的客人", () => {
  it("顯示名字、定裝照，並標出最愛的料", () => {
    render(<DinoSushiOrderBubble order={order} sushi={EMPTY_SUSHI} flash={null} index={0} total={5} />);
    const bubble = screen.getByRole("img", { name: /第 1 單/ });
    expect(bubble.getAttribute("data-customer")).toBe("xiaohong");
    expect(bubble.getAttribute("aria-label")).toContain("小紅想吃：握壽司、蝦");
    expect(bubble.querySelector("img")?.getAttribute("src")).toBe("/characters/小紅賽車.jpg");
    expect(bubble.textContent).toContain("小紅想吃");
    expect(bubble.querySelector("[data-favorite='true']")).not.toBeNull();
    expect(bubble.querySelector("[data-ready='true']")).toBeNull();
    expect(screen.queryByRole("button", { name: "小紅" })).toBeNull();
  });

  it("料放齊才出現愛心，客人自己沒有吃的按鈕", () => {
    const sushi = addTopping(changeBase(EMPTY_SUSHI, "nigiri"), "shrimp");
    render(<DinoSushiOrderBubble order={order} sushi={sushi} flash={null} index={2} total={5} />);
    const bubble = screen.getByRole("img", { name: /第 3 單/ });
    expect(bubble.querySelector("[data-ready='true']")).not.toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
