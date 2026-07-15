import { describe, expect, test } from "vitest";
import {
  COLORING_BACK_TO_COVER,
  COLORING_COVER_CTA,
  COLORING_PICKER_LEAD,
  coloringShellShowsTitle,
} from "./flow";

describe("coloring flow", () => {
  test("封面態隱藏 shell 標題，避免雙 h1", () => {
    expect(coloringShellShowsTitle("cover")).toBe(false);
    expect(coloringShellShowsTitle("picker")).toBe(true);
    expect(coloringShellShowsTitle("canvas")).toBe(true);
  });

  test("兒童向文案常數固定", () => {
    expect(COLORING_COVER_CTA).toBe("打開著色本");
    expect(COLORING_BACK_TO_COVER).toBe("回封面");
    expect(COLORING_PICKER_LEAD).toBe("選一頁來塗");
  });
});
