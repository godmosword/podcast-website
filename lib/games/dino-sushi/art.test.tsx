import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { BaseArt, DINO_SUSHI_CLAY_SRCS, PlateArt, SushiArt, ToppingArt, traySrc } from "./art";

vi.stubGlobal("React", React);

describe("壽司黏土圖", () => {
  it("組裝壽司仍是飯底加料，都指向 food 的縮小副本", () => {
    const html = renderToStaticMarkup(<SushiArt sushi={{ base: "temaki", toppings: ["salmon", "cucumber"] }} />);
    expect(html).toContain("/games/v2/dino-sushi/food/sm/temaki.webp");
    expect(html).toContain("/games/v2/dino-sushi/food/sm/temaki-front.webp");
    expect(html).toContain("/games/v2/dino-sushi/food/sm/salmon.webp");
    expect(html).toContain("/games/v2/dino-sushi/food/sm/cucumber.webp");
    expect(html.indexOf("temaki-front.webp")).toBeGreaterThan(html.indexOf("salmon.webp"));
    expect(html).toContain("rotate(");
    expect(html).not.toContain("<svg");
    expect(html.match(/<img /g)).toHaveLength(4);
  });

  it("手捲的料坐在飯口上：每一樣中心都在海苔前層（34.5%）以上、夠寬，一眼看得到包了什麼", () => {
    const ids = ["tamago", "shrimp", "crab", "corn", "cucumber", "tuna", "floss", "salmon", "avocado", "strawberry", "pudding", "wasabi"] as const;
    for (const id of ids) {
      const html = renderToStaticMarkup(<SushiArt sushi={{ base: "temaki", toppings: [id] }} />);
      const top = Number(html.match(/top:(\d+(?:\.\d+)?)%/)?.[1]);
      const width = Number(html.match(/left:\d+%;top:[\d.]+%;width:(\d+(?:\.\d+)?)%/)?.[1]);
      expect(top, id).toBeLessThan(30);
      expect(width, id).toBeGreaterThanOrEqual(50);
    }
  });

  it("沒選飯不畫", () => {
    expect(renderToStaticMarkup(<SushiArt sushi={{ base: null, toppings: [] }} />)).toBe("");
  });

  it("飯與料的圖檔分開", () => {
    expect(renderToStaticMarkup(<BaseArt id="nigiri" />)).toContain("/food/sm/nigiri.webp");
    expect(renderToStaticMarkup(<ToppingArt id="wasabi" />)).toContain("/food/sm/wasabi.webp");
  });

  it("裝飾盤用薄荷綠加濾鏡，金盤換成核准的黏土圖、不再套濾鏡", () => {
    const mint = renderToStaticMarkup(<PlateArt tone="mint" />);
    const gold = renderToStaticMarkup(<PlateArt gold />);
    const pink = renderToStaticMarkup(<PlateArt tone="pink" />);
    expect(mint).toContain("/shop/sm/plate.webp");
    expect(mint).not.toContain("filter:");
    expect(mint).not.toContain("plate-gold");
    expect(pink).toContain("hue-rotate");
    expect(gold).toContain("/shop/sm/plate-gold.webp");
    expect(gold).not.toContain("sepia");
    expect(gold).not.toContain("filter:");
  });

  it("金盤是填滿盤框的一張圖；提示章 plain 同一張、沒有程式光澤或星星", () => {
    /* React 19 會在最前面插入圖片預載的 <link>，比對元素本身前先拿掉 */
    const markup = (el: React.ReactElement) => renderToStaticMarkup(el).replace(/^(<link[^>]*>)+/, "");
    const gold = markup(<PlateArt gold />);
    expect(gold).toMatch(/^<img[^>]*data-gold-plate/);
    expect(gold).toContain("width:100%;height:100%");
    expect(gold).not.toContain("data-gold-shine");
    expect(gold).not.toContain("data-gold-star");

    const plain = markup(<PlateArt gold plain />);
    expect(plain).toContain("data-gold-plate");
    expect(plain).toContain("data-plain=\"true\"");
    expect(plain).toContain("/shop/sm/plate-gold.webp");
    expect(plain).not.toContain("sepia");
    expect(plain).not.toContain("data-gold-shine");
    expect(plain).not.toContain("data-gold-star");

    for (const other of [<PlateArt key="blue" />, <PlateArt key="pink" tone="pink" />]) {
      const html = markup(other);
      expect(html).toMatch(/^<img /);
      expect(html).not.toContain("data-gold");
    }
  });

  it("托盤依甜鹹芥末換底", () => {
    expect(traySrc("savory")).toContain("tray-neutral.webp");
    expect(traySrc("sweet")).toContain("tray-sweet.webp");
    expect(traySrc("wasabi")).toContain("tray-wasabi.webp");
  });

  it("預載含店面與全部飯、料", () => {
    expect(DINO_SUSHI_CLAY_SRCS).toEqual(
      expect.arrayContaining([
        "/games/v2/dino-sushi/shop/sm/wall.webp",
        "/games/v2/dino-sushi/shop/sm/belt.webp",
        "/games/v2/dino-sushi/shop/sm/prepplate.webp",
        "/games/v2/dino-sushi/food/sm/gunkan.webp",
        "/games/v2/dino-sushi/food/sm/temaki-front.webp",
        "/games/v2/dino-sushi/food/sm/pudding.webp",
      ]),
    );
    expect(new Set(DINO_SUSHI_CLAY_SRCS).size).toBe(DINO_SUSHI_CLAY_SRCS.length);
    expect(DINO_SUSHI_CLAY_SRCS).toContain("/games/v2/dino-sushi/shop/sm/plate-gold.webp");
    expect(DINO_SUSHI_CLAY_SRCS).toHaveLength(13 + 3 + 1 + 12);
    // 直式招牌已改成刻在櫃台前板的文字，不再預載
    expect(DINO_SUSHI_CLAY_SRCS.some((src) => src.includes("sign.webp"))).toBe(false);
    // 一律載縮小副本，不載原檔
    expect(DINO_SUSHI_CLAY_SRCS.every((src) => src.includes("/sm/"))).toBe(true);
  });
});
