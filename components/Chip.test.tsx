import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { TagChip } from "./Chip";

function styleAttr(html: string): string {
  return html.match(/style="([^"]*)"/)?.[1] ?? "";
}

describe("TagChip", () => {
  test("單集色只當淡底與邊框，不當前景字色", () => {
    const html = renderToStaticMarkup(<TagChip color="#f59f00">勇敢</TagChip>);
    const style = styleAttr(html);
    expect(style).not.toMatch(/(?:^|;)\s*color:/);
    expect(style).toMatch(/background-color/i);
    expect(style).toMatch(/border-color/i);
  });

  test("車種 chip 同樣不把單集色當字色", () => {
    const html = renderToStaticMarkup(
      <TagChip variant="vehicle" color="#0ea5e9">
        計程車
      </TagChip>,
    );
    const style = styleAttr(html);
    expect(style).not.toMatch(/(?:^|;)\s*color:/);
    expect(style).toMatch(/background-color/i);
  });
});
