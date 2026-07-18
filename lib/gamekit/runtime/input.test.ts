import { afterEach, describe, expect, it, vi } from "vitest";
import { InputManager } from "./input";

describe("gamekit input dash mapping", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("X／Shift 鍵映射為 dash，並可注入觸控 action", () => {
    let keyDown: ((event: KeyboardEvent) => void) | undefined;
    let keyUp: ((event: KeyboardEvent) => void) | undefined;
    vi.stubGlobal("window", {
      addEventListener: (type: string, handler: (event: KeyboardEvent) => void) => {
        if (type === "keydown") keyDown = handler;
        if (type === "keyup") keyUp = handler;
      },
      removeEventListener: vi.fn(),
    });

    const input = new InputManager();
    input.attach();
    const preventDefault = vi.fn();
    keyDown?.({ key: "x", preventDefault } as unknown as KeyboardEvent);
    expect(input.isHeld("dash")).toBe(true);
    expect(preventDefault).toHaveBeenCalled();
    keyUp?.({ key: "x" } as KeyboardEvent);
    expect(input.isHeld("dash")).toBe(false);

    input.inject("dash", "down");
    expect(input.wasPressed("dash")).toBe(true);
    expect(input.isHeld("dash")).toBe(true);
    input.inject("dash", "up");
    expect(input.isHeld("dash")).toBe(false);
    input.detach();
  });
});
