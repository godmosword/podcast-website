import { describe, expect, it } from "vitest";
import { loadEpisodeBoard, parseEpisodeBoard } from "@/lib/episode-board";

describe("episode board JSON", () => {
  it("最新一筆是多多刷牙，而且每筆都是站內故事", () => {
    const board = loadEpisodeBoard();
    expect(board.actors.map((actor) => actor.id)).toEqual(["ep-35", "ep-34", "ep-33"]);
    expect(board.actors[0]).toMatchObject({
      character: "duo-duo",
      action: "brush-teeth",
      featured: true,
      href: "/story/ep-35/play",
    });
    expect(board.dropped).toEqual([]);
    expect(board.coerced).toEqual([]);
    for (const actor of board.actors) {
      expect(actor.href.startsWith("/story/")).toBe(true);
      expect(actor.href).not.toMatch(/^https?:/i);
      expect(actor.title.length).toBeGreaterThan(0);
      expect(actor.summary.length).toBeGreaterThan(0);
    }
  });

  it("缺欄位、不認得的角色、外連會略過，不認得的動作改成休息", () => {
    const board = parseEpisodeBoard({
      version: 1,
      episodes: [
        {
          id: "ep-99",
          character: "no-such-car",
          action: "drive",
          title: "不存在的車",
          summary: "不該出現",
          href: "/story/ep-99",
        },
        { id: "broken" },
        {
          id: "ep-35",
          character: "duo-duo",
          action: "dance",
          title: "糖果",
          summary: "少吃糖",
          href: "/story/ep-35/play",
        },
        {
          id: "ep-out",
          character: "xiao-hong",
          action: "drive",
          title: "外連",
          summary: "不行",
          href: "https://example.com/story",
        },
        {
          id: "ep-track",
          character: "an-an",
          action: "drive",
          title: "追蹤",
          summary: "不行",
          href: "/story/ep-6?utm=1",
        },
        {
          id: "ep-34",
          character: "xiao-hong",
          action: "transform-robot",
          title: "小紅",
          summary: "變成機器人",
          href: "/story/ep-34",
        },
        {
          id: "ep-35-again",
          character: "duo-duo",
          action: "idle",
          title: "重複",
          summary: "同一台車只留第一筆",
          href: "/story/ep-35",
        },
      ],
    });

    expect(board.actors.map((actor) => actor.id)).toEqual(["ep-35", "ep-34"]);
    expect(board.actors[0]).toMatchObject({ action: "idle", featured: true });
    expect(board.actors[1]).toMatchObject({
      action: "transform-robot",
      featured: false,
      href: "/story/ep-34",
    });
    expect(board.coerced).toEqual([{ id: "ep-35", from: "dance", to: "idle" }]);
    expect(board.dropped.map((drop) => drop.reason)).toEqual([
      "unknown-character",
      "invalid",
      "unsafe-href",
      "unsafe-href",
      "duplicate-character",
    ]);
  });

  it("整份檔壞掉時回傳空小鎮，不丟例外", () => {
    expect(parseEpisodeBoard(null).actors).toEqual([]);
    expect(parseEpisodeBoard({ version: 2, episodes: [] }).actors).toEqual([]);
    expect(parseEpisodeBoard({ version: 1, episodes: "nope" }).actors).toEqual([]);
    expect(parseEpisodeBoard([]).actors).toEqual([]);
  });

  it("超過四台就不再加，頁面仍看得到前面的車", () => {
    const episodes = ["duo-duo", "xiao-hong", "hui-hui", "dong-dong", "ling-ling"].map(
      (character, index) => ({
        id: `ep-${index + 1}`,
        character,
        action: "idle",
        title: `第 ${index + 1} 台`,
        summary: "在小鎮裡",
        href: `/story/ep-${index + 1}`,
      }),
    );
    const board = parseEpisodeBoard({ version: 1, episodes });
    expect(board.actors).toHaveLength(4);
    expect(board.dropped.at(-1)?.reason).toBe("over-capacity");
  });
});
