import { describe, expect, it } from "vitest";
import {
  EMPTY_BLOCK_DROP_TUTORIAL,
  completeBlockDropTutorialStep,
  firstBlockDropTutorialStep,
  isBlockDropBoardNearLine,
  skipBlockDropTutorial,
  stepAfterBlockDropAction,
} from "./tutorial";

describe("Block Drop progressive tutorial", () => {
  it("依序提示移動、旋轉，消行提示留到接近滿排", () => {
    expect(firstBlockDropTutorialStep(EMPTY_BLOCK_DROP_TUTORIAL)).toBe("move");
    const moved = completeBlockDropTutorialStep(EMPTY_BLOCK_DROP_TUTORIAL, "move");
    expect(stepAfterBlockDropAction(moved, "move")).toBe("rotate");
    const rotated = completeBlockDropTutorialStep(moved, "rotate");
    expect(stepAfterBlockDropAction(rotated, "rotate")).toBeNull();
    expect(firstBlockDropTutorialStep(rotated)).toBe("line");
  });

  it("略過會一次記住完成狀態，replay 不再重複", () => {
    const skipped = skipBlockDropTutorial();
    expect(firstBlockDropTutorialStep(skipped)).toBeNull();
  });

  it("只在一行接近排滿時觸發消行理解提示", () => {
    expect(isBlockDropBoardNearLine([
      ["I", null, null, null],
      [null, null, null, null],
    ])).toBe(false);
    expect(isBlockDropBoardNearLine([
      ["I", "O", "T", null],
      [null, null, null, null],
    ])).toBe(true);
  });
});
