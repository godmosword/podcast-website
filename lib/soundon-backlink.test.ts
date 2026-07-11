import { describe, expect, it } from "vitest";
import {
  soundOnStoryBacklinkLine,
  soundOnStoryBacklinkUrl,
} from "./soundon-backlink";

describe("soundon-backlink", () => {
  it("單集 URL 含 UTM 與 slug campaign", () => {
    const url = soundOnStoryBacklinkUrl("ep-18");
    expect(url).toContain("/story/ep-18");
    expect(url).toContain("utm_source=cheche_web");
    expect(url).toContain("utm_medium=story_page");
    expect(url).toContain("utm_campaign=ep-18");
  });

  it("show notes 行含標題與連結", () => {
    const line = soundOnStoryBacklinkLine("ep-1", "第一集");
    expect(line).toContain("第一集");
    expect(line).toContain("utm_campaign=ep-1");
  });
});
