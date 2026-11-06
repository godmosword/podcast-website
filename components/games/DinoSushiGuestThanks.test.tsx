// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Order } from "@/lib/games/dino-sushi/orders";
import { DinoSushiGuestThanks } from "./DinoSushiGuestThanks";

describe("朋友的謝謝", () => {
  it("用跟排隊、點餐同一張去背貼紙，不是帶背景的定裝照", () => {
    const order = { base: "nigiri", toppings: ["tamago"], customerId: "xiaohong" } as unknown as Order;
    const { container } = render(<DinoSushiGuestThanks order={order} line="謝謝" leaving={false} />);
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "/games/v2/dino-sushi/customers/sm/xiaohong.webp",
    );
  });
});
