import { describe, expect, test } from "vitest";
import {
  CHARACTER_LINE_ART_PROMPT,
  COLORING_LINEART_REVIEW_CHECKLIST,
  SCENE_LINE_ART_PROMPT,
  formatColoringReviewChecklist,
  lineArtPromptFor,
} from "./coloring-ai-prompts";

describe("coloring AI prompts", () => {
  test("scene prompt 以圖 0 為構圖權威並禁止太陽雲替身場", () => {
    expect(SCENE_LINE_ART_PROMPT).toMatch(/image 0/i);
    expect(SCENE_LINE_ART_PROMPT).toMatch(/composition authority/i);
    expect(SCENE_LINE_ART_PROMPT).toMatch(/FORBIDDEN/i);
    expect(SCENE_LINE_ART_PROMPT).toMatch(/sun/i);
    expect(SCENE_LINE_ART_PROMPT).toMatch(/multi-vehicle|every main vehicle/i);
  });

  test("character prompt 要求保留大型道具、禁止太陽雲 stub", () => {
    expect(CHARACTER_LINE_ART_PROMPT).toMatch(/landmark props/i);
    expect(CHARACTER_LINE_ART_PROMPT).toMatch(/sun-and-cloud/i);
  });

  test("lineArtPromptFor 依 kind 分流", () => {
    expect(lineArtPromptFor("scene")).toBe(SCENE_LINE_ART_PROMPT);
    expect(lineArtPromptFor("character")).toBe(CHARACTER_LINE_ART_PROMPT);
  });

  test("審核清單含主角／地標／禁替身場", () => {
    expect(COLORING_LINEART_REVIEW_CHECKLIST.length).toBeGreaterThanOrEqual(4);
    const joined = COLORING_LINEART_REVIEW_CHECKLIST.join(" ");
    expect(joined).toContain("主角");
    expect(joined).toContain("地標");
    expect(joined).toContain("太陽雲");
    expect(formatColoringReviewChecklist()).toContain("人工審核清單");
  });
});
