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

  it("沒選飯不畫", () => {
    expect(renderToStaticMarkup(<SushiArt sushi={{ base: null, toppings: [] }} />)).toBe("");
  });

  it("飯與料的圖檔分開", () => {
    expect(renderToStaticMarkup(<BaseArt id="nigiri" />)).toContain("/food/sm/nigiri.webp");
    expect(renderToStaticMarkup(<ToppingArt id="wasabi" />)).toContain("/food/sm/wasabi.webp");
  });

  it("盤子用同一張薄荷綠，金盤與粉盤只差濾鏡", () => {
    const mint = renderToStaticMarkup(<PlateArt tone="mint" />);
    const gold = renderToStaticMarkup(<PlateArt gold />);
    const pink = renderToStaticMarkup(<PlateArt tone="pink" />);
    expect(mint).toContain("/shop/sm/plate.webp");
    expect(mint).not.toContain("filter:");
    expect(gold).toContain("sepia");
    expect(pink).toContain("hue-rotate");
    expect(gold).toContain("/shop/sm/plate.webp");
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
    expect(DINO_SUSHI_CLAY_SRCS).toHaveLength(12 + 3 + 1 + 12);
    // 直式招牌已改成刻在櫃台前板的文字，不再預載
    expect(DINO_SUSHI_CLAY_SRCS.some((src) => src.includes("sign.webp"))).toBe(false);
    // 一律載縮小副本，不載原檔
    expect(DINO_SUSHI_CLAY_SRCS.every((src) => src.includes("/sm/"))).toBe(true);
  });
});
