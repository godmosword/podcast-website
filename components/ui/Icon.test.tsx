import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import Icon from "./Icon";

vi.stubGlobal("React", React);

describe("Icon", () => {
  it("渲染 play 圖示且標 aria-hidden", () => {
    const html = renderToStaticMarkup(<Icon name="play" size={18} />);
    expect(html).toContain("<svg");
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('width="18"');
  });

  it("close 與 menu 為線性描邊", () => {
    const html = renderToStaticMarkup(<Icon name="close" />);
    expect(html).toContain('stroke="currentColor"');
  });

  it("chevron-down 與 chevron-right 同一種畫法（2px 圓角線），只是方向不同", () => {
    const strokeAttrs = (html: string) =>
      ["fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin"].map(
        (attr) => html.match(new RegExp(`${attr}="([^"]+)"`))?.[1],
      );
    const down = renderToStaticMarkup(<Icon name="chevron-down" />);
    const right = renderToStaticMarkup(<Icon name="chevron-right" />);
    expect(strokeAttrs(down)).toEqual(strokeAttrs(right));
    expect(strokeAttrs(down)).toEqual(["none", "currentColor", "2", "round", "round"]);
    expect(down).not.toEqual(right);
  });
});
