import { describe, expect, it } from "vitest";
import { candyKartIframeSrc } from "./iframe-src";

describe("candyKartIframeSrc", () => {
  it("預設載入 Godot Web export", () => {
    expect(candyKartIframeSrc()).toBe("/candy-kart/index.html");
  });

  it("將合法 debugFinish 賽道轉給 Godot iframe", () => {
    expect(candyKartIframeSrc("macaron-meadow")).toBe(
      "/candy-kart/index.html?debugFinish=macaron-meadow",
    );
  });

  it("忽略未知 debugFinish，避免把任意 query 塞進 iframe", () => {
    expect(candyKartIframeSrc("javascript:alert(1)")).toBe(
      "/candy-kart/index.html",
    );
  });
});
