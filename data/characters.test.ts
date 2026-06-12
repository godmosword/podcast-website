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

  it("ep-1 含沃特與蹦蹦", () => {
    const ids = getCharactersForStory("ep-1").map((c) => c.id);
    expect(ids).toContain("watt");
    expect(ids).toContain("bong-bong");
  });

  it("ep-2 含小飛", () => {
    const ids = getCharactersForStory("ep-2").map((c) => c.id);
    expect(ids).toContain("xiao-fei");
  });

  it("ep-3 含小紅、藍色小巴士、黃色計程車", () => {
    const ids = getCharactersForStory("ep-3").map((c) => c.id);
    expect(ids).toContain("xiao-hong");
    expect(ids).toContain("lan-ba-shi");
    expect(ids).toContain("huang-ji-cheng");
  });
});
