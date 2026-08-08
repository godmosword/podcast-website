import { describe, expect, it } from "vitest";
import { getCharacterName, getCharacters, getCharactersForStory } from "./characters";

describe("getCharacters", () => {
  it("回傳完整角色清單給角色頁與 JSON-LD 使用", () => {
    const characters = getCharacters();
    expect(characters.length).toBeGreaterThanOrEqual(20);
    expect(characters.map((c) => c.id)).toContain("an-an");
    expect(characters.every((c) => c.name && c.vehicle && c.personality)).toBe(
      true,
    );
  });
});

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

  it("ep-15 含多多、噴噴、玲玲、咚咚、小紅、髒髒小怪獸", () => {
    const ids = getCharactersForStory("ep-15").map((c) => c.id);
    expect(ids).toContain("duo-duo");
    expect(ids).toContain("pen-pen");
    expect(ids).toContain("ling-ling");
    expect(ids).toContain("dong-dong");
    expect(ids).toContain("xiao-hong");
    expect(ids).toContain("dirty-germs");
  });

  it("ep-16 含噗噗豬、海龜老師暖暖、安安、小紅", () => {
    const ids = getCharactersForStory("ep-16").map((c) => c.id);
    expect(ids).toContain("pu-pu-pig");
    expect(ids).toContain("nuan-nuan-turtle");
    expect(ids).toContain("an-an");
    expect(ids).toContain("xiao-hong");
  });

  it("ep-20 含水泥車阿尼", () => {
    const ids = getCharactersForStory("ep-20").map((c) => c.id);
    expect(ids).toContain("a-ni");
  });

  it("ep-18 含水上樂園主角：小紅、噗噗豬、暖暖", () => {
    const ids = getCharactersForStory("ep-18").map((c) => c.id);
    expect(ids).toContain("xiao-hong");
    expect(ids).toContain("pu-pu-pig");
    expect(ids).toContain("nuan-nuan-turtle");
  });

  it("ep-19 含多多、爆米花老爺爺、安安", () => {
    const ids = getCharactersForStory("ep-19").map((c) => c.id);
    expect(ids).toContain("duo-duo");
    expect(ids).toContain("popcorn-truck");
    expect(ids).toContain("an-an");
  });

  it("ep-21 含自動駕駛計程車知知（非黃色計程車）", () => {
    const ids = getCharactersForStory("ep-21").map((c) => c.id);
    expect(ids).toContain("zhi-zhi");
    expect(ids).not.toContain("huang-ji-cheng");
  });

  it("ep-23 含小紅賽車的爸爸與小紅賽車", () => {
    const ids = getCharactersForStory("ep-23").map((c) => c.id);
    expect(ids).toContain("xiao-hong-dad");
    expect(ids).toContain("xiao-hong");
  });

  it("ep-24 含小紅賽車的爸爸與小紅賽車", () => {
    const ids = getCharactersForStory("ep-24").map((c) => c.id);
    expect(ids).toContain("xiao-hong-dad");
    expect(ids).toContain("xiao-hong");
  });
});

describe("getCharacterName", () => {
  it("回傳角色正式名稱供 roamer 打招呼使用", () => {
    expect(getCharacterName("xiao-hong")).toBe("小紅賽車");
    expect(getCharacterName("a-ku")).toBe("阿酷鑽地車");
    expect(getCharacterName("a-ni")).toBe("水泥車阿尼");
    expect(getCharacterName("zhi-zhi")).toBe("自動駕駛計程車知知");
    expect(getCharacterName("xiao-hong-dad")).toBe("小紅賽車的爸爸");
  });

  it("查無角色時回傳 null", () => {
    expect(getCharacterName("not-real")).toBeNull();
  });
});
