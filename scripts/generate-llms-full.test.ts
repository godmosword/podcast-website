import { describe, expect, it } from "vitest";
import { getStories } from "../data/content";
import { buildLlmsFullText } from "./generate-llms-full";

describe("buildLlmsFullText", () => {
  it("產出包含全部故事的索引", () => {
    const text = buildLlmsFullText({
      siteUrl: "https://example.com",
      generatedAt: "2026-07-02T00:00:00.000Z",
    });
    const storySections = text.match(/^### 第 \d+ 集：/gm) ?? [];

    expect(storySections).toHaveLength(getStories().length);
  });

  it("每集區塊包含 URL 與非空定義式摘要", () => {
    const text = buildLlmsFullText({
      siteUrl: "https://example.com",
      generatedAt: "2026-07-02T00:00:00.000Z",
    });

    for (const story of getStories()) {
      expect(text).toContain(`### 第 ${story.ep} 集：${story.title}`);
      expect(text).toContain(`頁面 URL：https://example.com/story/${story.slug}`);
    }

    const firstStory = getStories()[0];
    const block = text.match(
      new RegExp(`### 第 ${firstStory.ep} 集：[^\\n]+\\n\\n([^\\n]+)`),
    )?.[1];
    expect(block?.trim().length).toBeGreaterThan(20);
    expect(block).not.toContain("undefined");
  });

  it("角色索引非空且連到 /characters", () => {
    const text = buildLlmsFullText({
      siteUrl: "https://example.com",
      generatedAt: "2026-07-02T00:00:00.000Z",
    });
    const characterIndex = text.split("## 角色索引")[1] ?? "";
    const characterLines = characterIndex
      .split("\n")
      .filter((line) => line.startsWith("- "));

    expect(characterLines.length).toBeGreaterThan(0);
    expect(characterLines[0]).toContain("https://example.com/characters");
    expect(characterLines.join("\n")).not.toContain("undefined");
  });
});
