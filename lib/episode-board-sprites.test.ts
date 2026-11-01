// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { blockSprite, resetSpriteCache, spriteBuildCount } from "@/lib/episode-board-sprites";

describe("episode board sprites", () => {
  it("同一顆圓角方塊的高光只光柵化一次", () => {
    resetSpriteCache();
    const first = blockSprite("rgb(247, 168, 196)", "cube");
    const again = blockSprite("rgb(247, 168, 196)", "cube");
    expect(again).toBe(first);
    expect(spriteBuildCount()).toBe(1);
    blockSprite("rgb(247, 168, 196)", "head");
    expect(spriteBuildCount()).toBe(2);
    blockSprite("rgb(183, 223, 155)", "cube");
    expect(spriteBuildCount()).toBe(3);
  });
});
