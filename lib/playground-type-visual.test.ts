import { describe, expect, it } from "vitest";
import { PLAYGROUND_TYPES } from "@/data/playgrounds";
import { playgroundTypeVisualKey } from "./playground-type-visual";

describe("playgroundTypeVisualKey", () => {
  it("每個 PlaygroundType 都有穩定 token", () => {
    const keys = PLAYGROUND_TYPES.map(playgroundTypeVisualKey);
    expect(new Set(keys).size).toBe(PLAYGROUND_TYPES.length);
    expect(playgroundTypeVisualKey("公園")).toBe("park");
    expect(playgroundTypeVisualKey("室內樂園")).toBe("indoor-park");
    expect(playgroundTypeVisualKey("主題樂園")).toBe("theme-park");
  });
});
