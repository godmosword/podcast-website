import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import LockedIslandBubble from "./LockedIslandBubble";

vi.stubGlobal("React", React);

describe("LockedIslandBubble", () => {
  it("渲染文案且 aria-hidden", () => {
    const html = renderToStaticMarkup(
      <LockedIslandBubble message="還在蓋喔！" bubbleKey={1} />,
    );
    expect(html).toContain("還在蓋喔！");
    expect(html).toContain('aria-hidden="true"');
  });

  it("reduced-motion 時加 bubbleReduced class", () => {
    const html = renderToStaticMarkup(
      <LockedIslandBubble message="先許願吧！" bubbleKey={2} reduced />,
    );
    expect(html).toContain("bubbleReduced");
  });
});
