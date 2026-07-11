import { describe, expect, it } from "vitest";
import { ICON_BUTTON_MIN_SIZE_PX, ICON_NAMES } from "./icons";

describe("icons", () => {
  it("ICON_NAMES 含導航／操作核心 glyph", () => {
    expect(ICON_NAMES).toContain("play");
    expect(ICON_NAMES).toContain("close");
    expect(ICON_NAMES).toContain("menu");
  });

  it("IconButton 觸控下限為 44px", () => {
    expect(ICON_BUTTON_MIN_SIZE_PX).toBe(44);
  });
});
