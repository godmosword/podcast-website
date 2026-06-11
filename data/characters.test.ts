import { describe, expect, it } from "vitest";
import { getCharactersForStory } from "./characters";

describe("getCharactersForStory", () => {
  it("maps ep-6 to an-an", () => {
    const ids = getCharactersForStory("ep-6").map((c) => c.id);
    expect(ids).toContain("an-an");
  });

  it("舊 slug ambulance 仍可對應角色", () => {
    const ids = getCharactersForStory("ambulance").map((c) => c.id);
    expect(ids).toContain("an-an");
  });

  it("ep-9 含多多與鈴鈴", () => {
    const ids = getCharactersForStory("ep-9").map((c) => c.id);
    expect(ids).toContain("duo-duo");
    expect(ids).toContain("ling-ling");
  });

  it("EP1–2 無登記角色", () => {
    expect(getCharactersForStory("ep-1")).toEqual([]);
    expect(getCharactersForStory("ep-2")).toEqual([]);
  });
});
