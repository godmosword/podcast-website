import { describe, expect, test } from "vitest";
import {
  COLORING_COVER_CTA,
  COLORING_DONE_CTA,
  COLORING_GALLERY_HEADING,
  COLORING_HINT_DRAW,
  COLORING_HINT_FILL,
  COLORING_PICKER_CHARACTERS,
  COLORING_PICKER_LEAD,
  COLORING_PICKER_SCENES,
} from "./flow";

describe("coloring flow", () => {
  test("兒童向文案常數固定", () => {
    expect(COLORING_COVER_CTA).toBe("打開著色本");
    expect(COLORING_PICKER_LEAD).toBe("選一頁來塗");
    expect(COLORING_PICKER_CHARACTERS).toBe("車車朋友");
    expect(COLORING_PICKER_SCENES).toBe("故事畫面");
    expect(COLORING_DONE_CTA).toBe("我塗好了");
    expect(COLORING_GALLERY_HEADING).toBe("我的作品");
    expect(COLORING_HINT_DRAW).toContain("蠟筆");
    expect(COLORING_HINT_FILL).toContain("填滿");
  });
});
