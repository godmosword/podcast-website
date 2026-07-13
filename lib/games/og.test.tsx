import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createGameOgImage,
  gameOgContentType,
  gameOgImageSize,
} from "./og";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("game og", () => {
  it("exports 1200×630 PNG metadata", () => {
    expect(gameOgImageSize).toEqual({ width: 1200, height: 630 });
    expect(gameOgContentType).toBe("image/png");
  });

  it.each(["play", "race", "puzzle"] as const)(
    "renders %s without external asset fetches",
    async (icon) => {
      const fetchMock = vi.fn(async () => {
        throw new Error("OG rendering must not fetch external assets");
      });
      globalThis.fetch = fetchMock;

      const response = await createGameOgImage({
        title: "車車遊樂園",
        icon,
        accentColor: "#b7df9b",
      });
      const image = await response.arrayBuffer();

      expect(image.byteLength).toBeGreaterThan(0);
      expect(
        fetchMock.mock.calls.every(([input]) => String(input).startsWith("data:")),
      ).toBe(true);
    },
  );
});
