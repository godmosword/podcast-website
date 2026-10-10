import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import Icon, { lineWidthFor } from "./Icon";

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

  it("返回／前往箭頭、勾選、連結、房子都是線性描邊（取代文字「←」「→」「✓」與各元件自畫的圖）", () => {
    for (const name of ["arrow-left", "arrow-right", "check", "link", "home"] as const) {
      const html = renderToStaticMarkup(<Icon name={name} />);
      expect(html, name).toContain('stroke="currentColor"');
      expect(html, name).toContain('stroke-linecap="round"');
      expect(html, name).toContain('fill="none"');
    }
  });

  it("小於 20px 時加粗線條，實際粗細和 20px 一樣（約 1.67px）", () => {
    expect(lineWidthFor(20)).toBe(2);
    expect(lineWidthFor(24)).toBe(2);
    expect(lineWidthFor(38)).toBe(2);
    for (const size of [14, 15, 16, 18]) {
      expect((lineWidthFor(size) * size) / 24, String(size)).toBeCloseTo((2 * 20) / 24, 1);
    }
    const html = renderToStaticMarkup(<Icon name="arrow-left" size={16} />);
    expect(html).toContain('stroke-width="2.5"');
  });
});
