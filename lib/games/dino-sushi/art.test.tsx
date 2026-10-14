import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { BaseArt, DINO_SUSHI_CLAY_SRCS, PlateArt, SushiArt, ToppingArt, traySrc } from "./art";

vi.stubGlobal("React", React);

describe("壽司黏土圖", () => {
  it("組裝壽司仍是飯底加料，兩張都指向 food webp", () => {
    const html = renderToStaticMarkup(<SushiArt sushi={{ base: "temaki", toppings: ["salmon", "cucumber"] }} />);
    expect(html).toContain("/games/v2/dino-sushi/food/temaki.webp");
    expect(html).toContain("/games/v2/dino-sushi/food/salmon.webp");
    expect(html).toContain("/games/v2/dino-sushi/food/cucumber.webp");
    expect(html).not.toContain("<svg");
    expect(html.match(/<img /g)).toHaveLength(3);
  });

  it("沒選飯不畫", () => {
    expect(renderToStaticMarkup(<SushiArt sushi={{ base: null, toppings: [] }} />)).toBe("");
  });

  it("飯與料的圖檔分開", () => {
    expect(renderToStaticMarkup(<BaseArt id="nigiri" />)).toContain("/food/nigiri.webp");
    expect(renderToStaticMarkup(<ToppingArt id="wasabi" />)).toContain("/food/wasabi.webp");
  });

  it("盤子用同一張薄荷綠，金盤與粉盤只差濾鏡", () => {
    const mint = renderToStaticMarkup(<PlateArt tone="mint" />);
    const gold = renderToStaticMarkup(<PlateArt gold />);
    const pink = renderToStaticMarkup(<PlateArt tone="pink" />);
    expect(mint).toContain("/shop/plate.webp");
    expect(mint).not.toContain("filter:");
    expect(gold).toContain("sepia");
    expect(pink).toContain("hue-rotate");
    expect(gold).toContain("/shop/plate.webp");
  });

  it("托盤依甜鹹芥末換底", () => {
    expect(traySrc("savory")).toContain("tray-neutral.webp");
    expect(traySrc("sweet")).toContain("tray-sweet.webp");
    expect(traySrc("wasabi")).toContain("tray-wasabi.webp");
  });

  it("預載含店面與全部飯、料", () => {
    expect(DINO_SUSHI_CLAY_SRCS).toEqual(
      expect.arrayContaining([
        "/games/v2/dino-sushi/shop/wall.webp",
        "/games/v2/dino-sushi/shop/belt.webp",
        "/games/v2/dino-sushi/shop/prepplate.webp",
        "/games/v2/dino-sushi/food/gunkan.webp",
        "/games/v2/dino-sushi/food/pudding.webp",
      ]),
    );
    expect(new Set(DINO_SUSHI_CLAY_SRCS).size).toBe(DINO_SUSHI_CLAY_SRCS.length);
    expect(DINO_SUSHI_CLAY_SRCS).toHaveLength(13 + 3 + 12);
  });
});
