import { describe, expect, it } from "vitest";

describe("useGameLoop module", () => {
  it("exports useGameLoop hook", async () => {
    const mod = await import("./useGameLoop");
    expect(typeof mod.useGameLoop).toBe("function");
  });
});
