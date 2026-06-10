import { describe, expect, it } from "vitest";
import { CHARACTERS, getCharacter, getCharactersForStory } from "./characters";

describe("characters.json registry", () => {
  it("has six canonical characters", () => {
    expect(CHARACTERS).toHaveLength(6);
  });

  it("maps ambulance story to an-an", () => {
    const ids = getCharactersForStory("ambulance").map((c) => c.id);
    expect(ids).toContain("an-an");
  });

  it("maps ep-9 to duo-duo and ling-ling", () => {
    const ids = getCharactersForStory("ep-9").map((c) => c.id);
    expect(ids).toEqual(expect.arrayContaining(["duo-duo", "ling-ling"]));
  });

  it("does not invent characters for stories without canonical art", () => {
    expect(getCharactersForStory("ev")).toEqual([]);
    expect(getCharactersForStory("drone")).toEqual([]);
    expect(getCharactersForStory("ep-7")).toEqual([]);
  });

  it("exposes ref path from json", () => {
    expect(getCharacter("an-an")?.ref).toBe("characters/安安救護車.jpg");
  });
});
