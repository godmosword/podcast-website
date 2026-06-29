import { describe, expect, it } from "vitest";
import { pickDir, pickFlip } from "./useRoamerSim";

describe("pickFlip（左右朝向遲滯）", () => {
  it("明顯左移用基準圖（face-left，flip=1）", () => {
    expect(pickFlip(-5, -1)).toBe(1);
  });

  it("明顯右移鏡像（flip=-1）", () => {
    expect(pickFlip(5, 1)).toBe(-1);
  });

  it("切線近零時維持原朝向（避免抖動）", () => {
    expect(pickFlip(0.2, -1)).toBe(-1);
    expect(pickFlip(-0.2, 1)).toBe(1);
  });
});

describe("pickDir（前後朝向遲滯）", () => {
  it("向下（朝觀者）→ front", () => {
    expect(pickDir(5, "rear")).toBe("front");
  });

  it("向上（遠離）→ rear", () => {
    expect(pickDir(-5, "front")).toBe("rear");
  });

  it("垂直分量近零時維持原朝向", () => {
    expect(pickDir(0.3, "rear")).toBe("rear");
    expect(pickDir(-0.3, "front")).toBe("front");
  });
});
