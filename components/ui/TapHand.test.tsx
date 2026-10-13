import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import TapHand from "./TapHand";

vi.stubGlobal("React", React);

describe("TapHand", () => {
  it("輸出和著色本原本的手指一模一樣（共用後截圖不變）", () => {
    const html = renderToStaticMarkup(<TapHand className="hand" />);
    expect(html).toBe(
      '<svg class="hand" viewBox="0 0 64 64" focusable="false"><path d="M28 18c0-4 3-7 6.2-7 3.4 0 5.8 2.8 5.8 6.4V34l6.2-3.2c2.4-1.2 5.2.2 5.6 2.8.3 2.2-.8 4.2-2.6 5.2L38 48.5c-3.2 2.2-7 3.4-11 3.4-8.2 0-14-5.4-14-13.2V30.2c0-2.6 2-4.6 4.6-4.6 1.6 0 3 .8 3.8 2.1V24c0-2.4 1.8-4.4 4.2-4.4 1.5 0 2.8.8 3.6 2v-3.6Z" fill="#ffe3c4" stroke="#5d4a67" stroke-width="2.4" stroke-linejoin="round"></path></svg>',
    );
  });
});
