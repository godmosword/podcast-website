import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import DuduMoment from "./DuduMoment";

vi.stubGlobal("React", React);

describe("DuduMoment", () => {
  it("互動態輸出真正的 button，可供鍵盤聚焦（UX-P2-4）", () => {
    const html = renderToStaticMarkup(
      <DuduMoment
        emotion="happy"
        label="嘟嘟小紅車"
        variant="companion"
        interactive
        onInteract={() => undefined}
      />,
    );
    expect(html).toContain("<button");
    expect(html).toContain('type="button"');
    expect(html).toContain("嘟嘟小紅車：開心");
    expect(html).not.toMatch(/tabindex="0"/i);
  });
});
