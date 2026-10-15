// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SushiArt } from "./art";
import type { ToppingId } from "./toppings";

afterEach(cleanup);

/** 每一層料的外層 span（依疊放順序），以料名對照。 */
function layers(container: HTMLElement): Map<string, Element> {
  const out = new Map<string, Element>();
  for (const img of container.querySelectorAll('[data-sushi] > span img')) {
    const name = img.getAttribute("src")!.split("/").pop()!.replace(".webp", "");
    out.set(name, img.closest("[data-sushi] > span")!);
  }
  return out;
}

describe("砧板上的料重掛規則", () => {
  it("滿了擠掉最舊那層：留下來的兩層不重掛（不重播落下動畫），只有新的那層是新元素", () => {
    const sushi = (toppings: ToppingId[]) => ({ base: "nigiri" as const, toppings });
    const { container, rerender } = render(<SushiArt sushi={sushi(["tamago", "shrimp", "crab"])} />);
    const before = layers(container);
    rerender(<SushiArt sushi={sushi(["shrimp", "crab", "corn"])} />);
    const after = layers(container);
    expect(after.get("shrimp")).toBe(before.get("shrimp"));
    expect(after.get("crab")).toBe(before.get("crab"));
    expect(after.has("tamago")).toBe(false);
    expect([...before.values()]).not.toContain(after.get("corn"));
  });

  it("拿掉中間那層：其他層不重掛", () => {
    const { container, rerender } = render(<SushiArt sushi={{ base: "temaki", toppings: ["tuna", "salmon", "crab"] }} />);
    const before = layers(container);
    rerender(<SushiArt sushi={{ base: "temaki", toppings: ["tuna", "crab"] }} />);
    const after = layers(container);
    expect(after.get("tuna")).toBe(before.get("tuna"));
    expect(after.get("crab")).toBe(before.get("crab"));
    expect(after.has("salmon")).toBe(false);
  });
});
