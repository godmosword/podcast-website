import { describe, expect, it } from "vitest";
import { ZONE_MOTION, type MotionPart } from "./universe-zone-motion";

describe("universe-zone-motion", () => {
  it("每島內 part name 唯一", () => {
    for (const parts of Object.values(ZONE_MOTION)) {
      if (!parts) continue;
      const names = parts.map((p) => p.name);
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it("spin/sweep 必有 pivot", () => {
    for (const parts of Object.values(ZONE_MOTION)) {
      if (!parts) continue;
      for (const part of parts) {
        if (part.motion === "spin" || part.motion === "sweep") {
          expect(part.pivot).toBeDefined();
          expect(part.pivot!.x).toBeGreaterThanOrEqual(0);
          expect(part.pivot!.x).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it("path 必有 path 字串", () => {
    for (const parts of Object.values(ZONE_MOTION)) {
      if (!parts) continue;
      for (const part of parts) {
        if (part.motion === "path") {
          expect(part.path.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("sprite 必有 frames/fps", () => {
    const allParts: MotionPart[] = Object.values(ZONE_MOTION).flatMap((p) => p ?? []);
    const sprites = allParts.filter((p) => p.motion === "sprite");
    for (const part of sprites) {
      if (part.motion === "sprite") {
        expect(part.sprite.frames).toBeGreaterThan(0);
        expect(part.sprite.fps).toBeGreaterThan(0);
      }
    }
  });

  it("sway 必有 amplitudeDeg", () => {
    for (const parts of Object.values(ZONE_MOTION)) {
      if (!parts) continue;
      for (const part of parts) {
        if (part.motion === "sway") {
          expect(part.amplitudeDeg).toBeGreaterThan(0);
        }
      }
    }
  });

  it("bob 必有 amplitudePx", () => {
    for (const parts of Object.values(ZONE_MOTION)) {
      if (!parts) continue;
      for (const part of parts) {
        if (part.motion === "bob") {
          expect(part.amplitudePx).toBeGreaterThan(0);
        }
      }
    }
  });
});
