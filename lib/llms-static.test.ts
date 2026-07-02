import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("llms.txt", () => {
  it("提供 AI 可讀的站點定義、路由地圖與引用授權", () => {
    const text = readFileSync(join(process.cwd(), "public/llms.txt"), "utf8");

    expect(text).toMatch(/^# 車車遊樂園/m);
    expect(text).toContain("車車遊樂園是一個");
    expect(text).toContain("/stories");
    expect(text).toContain("/story/");
    expect(text).toContain("/feed.xml");
    expect(text).toContain("車車故事");
    expect(text).toContain("禁止商用轉載");
    expect(text).toContain("允許引用並附連結");
  });
});
