import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import UniverseMapParallax from "./UniverseMapParallax";

vi.stubGlobal("React", React);

describe("UniverseMapParallax", () => {
  const html = renderToStaticMarkup(
    <UniverseMapParallax
      tx={0}
      ty={0}
      scale={1}
      isAnimating={false}
      reduced={false}
      paused={false}
      daylight="light"
    />,
  );

  it("海洋滿版後不再輸出遠島剪影", () => {
    expect(html).not.toContain("far-island");
  });

  it("仍輸出黏土雲團", () => {
    expect(html).toContain("cloud-a");
  });

  it("不再內嵌 SkyBodies（改由 UniverseMap 以 screen-space 掛載）", () => {
    expect(html).not.toContain("sun");
    expect(html).not.toContain("moon");
  });
});
