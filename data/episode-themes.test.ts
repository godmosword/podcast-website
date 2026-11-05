import { describe, expect, it } from "vitest";
import { getStories } from "./content";
import { storyDisplayTitle } from "@/lib/story-title";
import { isSubtitleProofreadMarked } from "../scripts/lib/subtitle-proofread";
import {
  EPISODE_THEMES,
  STORY_FINDER_THEMES,
  episodeFinderTheme,
  isStoryFinderTheme,
} from "./episode-themes";

describe("找故事主題", () => {
  it("下拉只有這七個，順序固定", () => {
    expect([...STORY_FINDER_THEMES]).toEqual([
      "成長勇氣",
      "責任品格",
      "生活好習慣",
      "情緒管理",
      "交友與合作助人",
      "安全與自我保護",
      "思考與創造",
    ]);
  });

  it("表裡每一列都對得上故事、主題是七個之一", () => {
    const stories = new Map(getStories().map((story) => [story.slug, story]));
    const eps = EPISODE_THEMES.map((row) => row.ep);
    expect(eps).toEqual([...eps].sort((a, b) => a - b));
    for (const row of EPISODE_THEMES) {
      const story = stories.get(row.slug);
      expect(story, row.slug).toBeDefined();
      expect(row.ep).toBe(story?.ep);
      expect(row.title).toBe(story ? storyDisplayTitle(story) : "");
      expect(isStoryFinderTheme(row.theme)).toBe(true);
      expect(episodeFinderTheme(row.slug)).toBe(row.theme);
    }
    expect(isStoryFinderTheme("合作")).toBe(false);
    expect(episodeFinderTheme("missing")).toBe("");
  });

  // 同步不能寫這張手寫表、同步 PR 也不跑單元測試：剛上架、還沒校對的新集可以先沒有主題，
  // 由 verify:episodes 列 theme-pending；校對完（--mark）就一定要有。
  it("沒在表裡的只能是字幕還沒 --mark 的集數", () => {
    const listed = new Set(EPISODE_THEMES.map((row) => row.slug));
    const missing = getStories().filter((story) => !listed.has(story.slug));
    expect(missing.filter((story) => isSubtitleProofreadMarked(story.slug)).map((story) => story.slug)).toEqual([]);
  });
});
