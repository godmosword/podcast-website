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

  it("有 familyActivity 的集數摘要後附「聽完聊一聊」，其他集數無痕跡", () => {
    const text = buildLlmsFullText({
      siteUrl: "https://example.com",
      generatedAt: "2026-07-02T00:00:00.000Z",
    });

    const withActivity = getStories().filter((s) => s.familyActivity);
    expect(withActivity.length).toBeGreaterThanOrEqual(2);
    for (const story of withActivity) {
      expect(text).toContain(
        `🏡 聽完聊一聊：${story.familyActivity!.question}`,
      );
    }

    const occurrences = text.match(/🏡 聽完聊一聊：/g) ?? [];
    expect(occurrences).toHaveLength(withActivity.length);
  });

  it("有 episodeFaq 的集數摘要後附「❓」問答行，其他集數無痕跡", () => {
    const text = buildLlmsFullText({
      siteUrl: "https://example.com",
      generatedAt: "2026-07-02T00:00:00.000Z",
    });

    const withFaq = getStories().filter((s) => s.episodeFaq);
    expect(withFaq.length).toBeGreaterThan(0);
    for (const story of withFaq) {
      expect(text).toContain(
        `❓ ${story.episodeFaq!.question}：${story.episodeFaq!.answer}`,
      );
    }

    const occurrences = text.match(/❓ /g) ?? [];
    expect(occurrences).toHaveLength(withFaq.length);
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

  it("每集區塊含大綱要點，有完整逐字稿的集數附完整逐字稿連結", () => {
    const text = buildLlmsFullText({
      siteUrl: "https://example.com",
      generatedAt: "2026-07-02T00:00:00.000Z",
    });

    expect(text).toContain("大綱要點：");
    expect(text).toContain("完整逐字稿（WebVTT）");
    expect(text).not.toMatch(/- 逐字稿（WebVTT）：/);

    const firstStory = getStories()[0];
    const blockStart = text.indexOf(`### 第 ${firstStory.ep} 集：${firstStory.title}`);
    const nextBlock = text.indexOf("### 第 ", blockStart + 1);
    const block =
      nextBlock > blockStart
        ? text.slice(blockStart, nextBlock)
        : text.slice(blockStart);

    expect(block).toMatch(/- .+/);
  });
});
