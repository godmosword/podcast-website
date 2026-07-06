import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import FavoriteButton from "./FavoriteButton";

vi.stubGlobal("React", React);

describe("FavoriteButton", () => {
  it("SSR 初始為未收藏狀態，帶星星爆發容器 class", () => {
    const html = renderToStaticMarkup(<FavoriteButton slug="ep-1" />);

    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain("加入最愛");
    expect(html).toContain("star-burst-wrap");
    expect(html).toContain("press-squash");
  });
});
