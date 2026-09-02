import type { Story } from "./content";

export type StoryDateInput = Pick<Story, "slug" | "date">;

/** 最後內容編輯時間：來源為每集專屬圖片、字幕、scene 檔的最後已提交 git commit。 */
export const storyModifiedDates: Record<string, string> = {
  "ep-1": "2026-06-13T05:41:07Z",
  "ep-2": "2026-06-13T05:41:07Z",
  "ep-3": "2026-06-13T05:41:07Z",
  "ep-4": "2026-06-15T07:31:45Z",
  "ep-5": "2026-06-15T07:31:45Z",
  "ep-6": "2026-06-15T07:31:45Z",
  "ep-7": "2026-06-15T07:31:45Z",
  "ep-8": "2026-06-15T07:31:45Z",
  "ep-9": "2026-06-13T05:41:07Z",
  "ep-10": "2026-06-15T07:31:45Z",
  "ep-11": "2026-06-15T07:31:45Z",
  "ep-12": "2026-06-15T18:58:58Z",
  "ep-13": "2026-06-19T16:24:48Z",
  "ep-14": "2026-06-27T09:16:04+08:00",
  "ep-15": "2026-06-28T04:28:25Z",
  "ep-16": "2026-07-01T00:34:33Z",
  "ep-17": "2026-07-03T13:53:43Z",
  "ep-18": "2026-07-07T01:45:00Z",
  "ep-19": "2026-07-15T14:20:00Z",
  "ep-20": "2026-07-17T08:44:40.173Z",
  "ep-21": "2026-07-22T14:19:03.679Z",
  "ep-22": "2026-07-24T10:48:09.771Z",
  "ep-23": "2026-07-28T09:24:50.083Z",
  "ep-24": "2026-08-04T09:34:23.742Z",
  "ep-25": "2026-08-12T08:06:21.625Z",
  "ep-26": "2026-08-19T11:22:55.657Z",
  "ep-27": "2026-08-26T11:00:25.411Z",
  "ep-28": "2026-09-02T19:04:04.783Z",
};

export const STORY_MODIFIED_DATE_SOURCE: Record<string, string> = {
  "ep-1": "e6cb928 public/stories/ep-1 + data/scenes/subtitles",
  "ep-2": "e6cb928 public/stories/ep-2 + data/scenes/subtitles",
  "ep-3": "e6cb928 public/stories/ep-3 + data/scenes/subtitles",
  "ep-4": "fd80679 public/stories/ep-4 + data/scenes/subtitles",
  "ep-5": "fd80679 public/stories/ep-5 + data/scenes/subtitles",
  "ep-6": "fd80679 public/stories/ep-6 + data/scenes/subtitles",
  "ep-7": "fd80679 public/stories/ep-7 + data/scenes/subtitles",
  "ep-8": "fd80679 public/stories/ep-8 + data/scenes/subtitles",
  "ep-9": "e6cb928 public/stories/ep-9 + data/scenes/subtitles",
  "ep-10": "fd80679 public/stories/ep-10 + data/scenes/subtitles",
  "ep-11": "fd80679 public/stories/ep-11 + data/scenes/subtitles",
  "ep-12": "25e26b2 public/stories/ep-12 + data/scenes/subtitles",
  "ep-13": "71086db public/stories/ep-13 + data/scenes/subtitles",
  "ep-14": "55bbff6 public/stories/ep-14 + data/scenes/subtitles",
  "ep-15": "6df1adb public/stories/ep-15 + data/scenes/subtitles",
  "ep-16": "3fbf4fd public/stories/ep-16 + data/scenes/subtitles",
  "ep-17": "229668e public/stories/ep-17 + data/scenes/subtitles",
  "ep-18": "aaafa19 public/stories/ep-18 MVP sync",
  "ep-19": "0dd9705 illustrate ep-19 full 17 scenes + proofread",
  "ep-20": "aa3d8ea sync Apple RSS MVP",
  "ep-21": "37c2d54 sync Apple RSS MVP",
  "ep-22": "078fdd7 sync Apple RSS MVP",
  "ep-23": "bee2e35 sync Apple RSS MVP",
  "ep-24": "55394a8 sync Apple RSS MVP",
  "ep-25": "eef046f sync Apple RSS MVP",
  "ep-26": "ebbc94b sync Apple RSS MVP",
  "ep-27": "96ab2c3 sync Apple RSS MVP",
  "ep-28": "087d6cc sync Apple RSS MVP",
};

export function storyDateModified(story: StoryDateInput): string {
  return storyModifiedDates[story.slug] ?? `${story.date}T00:00:00+08:00`;
}
