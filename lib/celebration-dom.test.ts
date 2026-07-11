import { describe, expect, it } from "vitest";
import { createRadialBurstParticles } from "./celebration-dom";

describe("celebration-dom", () => {
  it("createRadialBurstParticles 產生 count 顆粒子", () => {
    const particles = createRadialBurstParticles({ count: 6, seed: 42 });
    expect(particles).toHaveLength(6);
    expect(particles[0]?.x).toMatch(/px$/);
    expect(particles[0]?.y).toMatch(/px$/);
  });
});
