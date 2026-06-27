import { describe, expect, it } from "vitest";
import {
  createUniverseOgImage,
  universeOgContentType,
  universeOgImageSize,
} from "./og";

describe("universe og", () => {
  it("exports 1200×630 PNG metadata", () => {
    expect(universeOgImageSize).toEqual({ width: 1200, height: 630 });
    expect(universeOgContentType).toBe("image/png");
  });

  it("createUniverseOgImage returns ImageResponse", async () => {
    const res = createUniverseOgImage();
    expect(res).toBeTruthy();
    expect(typeof (res as Response).arrayBuffer).toBe("function");
    const buf = await (res as Response).arrayBuffer();
    expect(buf.byteLength).toBeGreaterThan(0);
  });
});
