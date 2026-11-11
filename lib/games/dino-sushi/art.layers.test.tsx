// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SushiArt } from "./art";
import { addTopping, changeBase, EMPTY_SUSHI, removeTopping, type Sushi } from "./sushi";
import type { BaseId, ToppingId } from "./toppings";

afterEach(cleanup);

/** 每一層料的外層 span，以料名對照。 */
function layers(container: HTMLElement): Map<string, HTMLElement> {
  const out = new Map<string, HTMLElement>();
  for (const img of container.querySelectorAll('[data-sushi] > span img')) {
    const name = img.getAttribute("src")!.split("/").pop()!.replace(".webp", "");
    out.set(name, img.closest<HTMLElement>("[data-sushi] > span")!);
  }
  return out;
}

/**
 * 換一組料，回傳這次被（重新）插進 DOM 的料層。
 * 瀏覽器會讓被搬動（拔掉再插回）的元素重播 CSS 動畫，所以留下來的料不能出現在這裡。
 */
function rerenderAdded(base: BaseId, from: ToppingId[], to: ToppingId[]) {
  const sushi = (toppings: ToppingId[]) => ({ base, toppings });
  const { container, rerender } = render(<SushiArt sushi={sushi(from)} />);
  const before = layers(container);
  const root = container.querySelector("[data-sushi]")!;
  const observer = new MutationObserver(() => {});
  observer.observe(root, { childList: true });
  rerender(<SushiArt sushi={sushi(to)} />);
  const added = observer.takeRecords().flatMap((r) => [...r.addedNodes]);
  observer.disconnect();
  return { before, after: layers(container), added };
}

describe("砧板上的料重掛規則", () => {
  it.each(["nigiri", "gunkan", "temaki"] as const)(
    "%s 滿了擠掉最舊那層：留下來的兩層不重掛也不被搬動，只插入新的那層",
    (base) => {
      const { before, after, added } = rerenderAdded(base, ["tamago", "shrimp", "corn"], ["shrimp", "corn", "crab"]);
      expect(after.get("shrimp")).toBe(before.get("shrimp"));
      expect(after.get("corn")).toBe(before.get("corn"));
      expect(after.has("tamago")).toBe(false);
      expect(added).toEqual([after.get("crab")]);
    },
  );

  describe("同一種料放兩次（[玉子、蝦、玉子]）", () => {
    /** 依 DOM 順序列出每一層的 span（同名料不會互相蓋掉）。 */
    const spans = (container: HTMLElement) => [...container.querySelectorAll<HTMLElement>("[data-sushi] > span")]
      .filter((s) => s.querySelector('img[src*="/food/"]'));
    const build = (ids: ToppingId[]) => ids.reduce((s, id) => addTopping(s, id), changeBase(EMPTY_SUSHI, "nigiri"));

    function rerenderSushi(from: Sushi, to: Sushi) {
      const { container, rerender } = render(<SushiArt sushi={from} />);
      const before = spans(container);
      const root = container.querySelector("[data-sushi]")!;
      const observer = new MutationObserver(() => {});
      observer.observe(root, { childList: true });
      rerender(<SushiArt sushi={to} />);
      const added = observer.takeRecords().flatMap((r) => [...r.addedNodes]);
      observer.disconnect();
      return { before, after: spans(container), added };
    }

    it("滿了再加料：擠掉第一個玉子，蝦和第二個玉子都是原來的節點，只插入新的那層", () => {
      const from = build(["tamago", "shrimp", "tamago"]);
      const { before, after, added } = rerenderSushi(from, addTopping(from, "crab"));
      expect(after[0]).toBe(before[1]);
      expect(after[1]).toBe(before[2]);
      expect(after).not.toContain(before[0]);
      expect(added).toEqual([after[2]]);
    });

    it("拿掉第一個玉子：第二個玉子不重掛、不被搬動", () => {
      const from = build(["tamago", "shrimp", "tamago"]);
      const { before, after, added } = rerenderSushi(from, removeTopping(from, 0));
      expect(after).toEqual([before[1], before[2]]);
      expect(added).toEqual([]);
    });
  });

  it("拿掉中間那層：其他層不重掛、不被搬動", () => {
    const { before, after, added } = rerenderAdded("temaki", ["tuna", "salmon", "crab"], ["tuna", "crab"]);
    expect(after.get("tuna")).toBe(before.get("tuna"));
    expect(after.get("crab")).toBe(before.get("crab"));
    expect(after.has("salmon")).toBe(false);
    expect(added).toEqual([]);
  });

  it("疊放順序用 z-index：越下面越前面，手捲海苔前層蓋在所有料上面", () => {
    const { container } = render(<SushiArt sushi={{ base: "temaki", toppings: ["shrimp", "crab", "corn"] }} />);
    const z = (el: Element | null | undefined) => Number((el as HTMLElement).style.zIndex);
    const spans = [...layers(container).values()];
    const tops = spans.map((s) => parseFloat(s.style.top));
    const zs = spans.map(z);
    for (let i = 0; i < spans.length; i++) {
      for (let j = 0; j < spans.length; j++) if (tops[i]! < tops[j]!) expect(zs[i]).toBeLessThan(zs[j]!);
    }
    const front = container.querySelector('img[src$="temaki-front.webp"]');
    expect(z(front)).toBeGreaterThan(Math.max(...zs));
  });

  it("手捲三樣料：中間那樣抬高到兩側上方、斜一點；兩側不抬", () => {
    const spot = (toppings: ToppingId[], name: string) => {
      const { container } = render(<SushiArt sushi={{ base: "temaki", toppings }} />);
      const span = layers(container).get(name)!;
      const out = { top: parseFloat(span.style.top), transform: span.style.transform };
      cleanup();
      return out;
    };
    // 鮭魚 2026-11-09 改成 y 25（新手捲上放大、冒出筒口），中間再抬 12 → 13
    expect(spot(["salmon", "shrimp", "crab"], "salmon")).toEqual({ top: 13, transform: "translate(-50%, -50%) rotate(-18deg)" });
    // 鮭魚在左側：不抬高（y 25 ＋ 3）
    expect(spot(["shrimp", "salmon", "crab"], "salmon")).toEqual({ top: 28, transform: "translate(-50%, -50%) rotate(-26deg)" });
  });
});
