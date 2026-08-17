import { describe, expect, it } from "vitest";
import {
  PLAY_MAP_EDITORIAL_PICKS,
  validatePlayMapEditorialPicks,
} from "./play-map-editorial-picks";

describe("play-map editorial picks", () => {
  it("所有 seeded placeId 都存在且 sidecar 沒有 validation issue", () => {
    expect(validatePlayMapEditorialPicks()).toEqual([]);
    expect(PLAY_MAP_EDITORIAL_PICKS).toHaveLength(4);
  });

  it("回報 invalid、duplicate、空 reason 與未知 intent", () => {
    const issues = validatePlayMapEditorialPicks(
      [
        {
          placeId: "missing-place",
          intents: ["free"],
          reason: "有理由",
        },
        {
          placeId: "ty-fenghe",
          intents: ["free"],
          reason: "有理由",
        },
        {
          placeId: "ty-fenghe",
          intents: ["not-an-intent" as never],
          reason: " ",
        },
      ],
      [{ id: "ty-fenghe" }],
    );

    expect(issues).toEqual(
      expect.arrayContaining([
        { placeId: "missing-place", message: "placeId does not reference a playground" },
        { placeId: "ty-fenghe", message: "duplicate placeId" },
        { placeId: "ty-fenghe", message: "unknown editorial intent: not-an-intent" },
        { placeId: "ty-fenghe", message: "reason must not be empty" },
      ]),
    );
  });
});
