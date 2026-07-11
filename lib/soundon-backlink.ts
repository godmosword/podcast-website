import { appendPlatformUtm } from "@/lib/platform-utm";
import { storyShareUrl } from "@/lib/share-story";

/** Growth-Measure-1：SoundOn show notes 用官網單集回鏈（含 UTM）。 */
export function soundOnStoryBacklinkUrl(slug: string): string {
  const base = storyShareUrl(slug);
  return appendPlatformUtm(base, {
    source: "story-cta",
    campaign: slug,
  });
}

/** SoundOn 後台 show notes 建議尾段（純文字，人工貼上）。 */
export function soundOnStoryBacklinkLine(slug: string, title: string): string {
  const url = soundOnStoryBacklinkUrl(slug);
  return `看圖聽完整故事：${title}\n${url}`;
}
