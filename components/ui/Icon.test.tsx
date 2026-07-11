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
});
