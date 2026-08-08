// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { releaseBoardPointerCapture } from "./BlockDropView";

describe("releaseBoardPointerCapture", () => {
  beforeEach(() => {
    Element.prototype.hasPointerCapture = vi.fn(() => true);
    Element.prototype.releasePointerCapture = vi.fn();
  });

  it("有 capture 時呼叫 releasePointerCapture", () => {
    const el = document.createElement("div");
    releaseBoardPointerCapture(el, 9);
    expect(el.hasPointerCapture).toHaveBeenCalledWith(9);
    expect(el.releasePointerCapture).toHaveBeenCalledWith(9);
  });

  it("無 capture 時不呼叫 releasePointerCapture", () => {
    Element.prototype.hasPointerCapture = vi.fn(() => false);
    const el = document.createElement("div");
    releaseBoardPointerCapture(el, 9);
    expect(el.releasePointerCapture).not.toHaveBeenCalled();
  });
});
