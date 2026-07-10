import { describe, expect, it } from "vitest";
import { getStories, storiesByNewest } from "@/data/content";
import { metadata as aboutMetadata } from "@/app/about/page";
import { metadata as adventuresMetadata } from "@/app/adventures/page";
import { metadata as storiesMetadata } from "@/app/stories/page";
import { generateMetadata as generateTopicMetadata } from "@/app/topic/[tag]/page";
import { generateMetadata as generateVehicleMetadata } from "@/app/vehicles/[vehicle]/page";
import { hasVtt } from "@/lib/transcript";
import { storyDetailMetadata, storyPlayMetadata } from "./story-metadata";

describe("storyDetailMetadata", () => {
  it("含自我 canonical", () => {
    const story = storiesByNewest()[0];
    const meta = storyDetailMetadata(story);
    expect(meta.alternates?.canonical).toBe(`/story/${story.slug}`);
  });

  it("有 VTT 的集數 alternates 含 text/vtt", () => {
    const story = getStories().find((item) => hasVtt(item));
    expect(story).toBeDefined();

    const meta = storyDetailMetadata(story!);
    const types = meta.alternates?.types as Record<string, string> | undefined;
    expect(types?.["text/vtt"]).toBe(`/story/${story!.slug}/transcript.vtt`);
  });
});

describe("storyPlayMetadata", () => {
  it("canonical 指向詳情頁且 noindex", () => {
    const story = storiesByNewest()[0];
    const meta = storyPlayMetadata(story);
    expect(meta.alternates?.canonical).toBe(`/story/${story.slug}`);
    expect(meta.robots).toMatchObject({ index: false, follow: true });
  });
});

describe("static page metadata canonical", () => {
  it("全部故事", () => {
    expect(storiesMetadata.alternates?.canonical).toBe("/stories");
  });

  it("關於我們", () => {
    expect(aboutMetadata.alternates?.canonical).toBe("/about");
  });

  it("宇宙地圖", () => {
    expect(adventuresMetadata.alternates?.canonical).toBe("/adventures");
  });
});

describe("dynamic page metadata canonical", () => {
  it("主題頁 encode 中文 tag", async () => {
    const meta = await generateTopicMetadata({
      params: Promise.resolve({ tag: encodeURIComponent("睡前") }),
    });
    expect(meta.alternates?.canonical).toBe(`/topic/${encodeURIComponent("睡前")}`);
  });

  it("車種頁 encode 中文 vehicle", async () => {
    const meta = await generateVehicleMetadata({
      params: Promise.resolve({ vehicle: encodeURIComponent("恐龍車") }),
    });
    expect(meta.alternates?.canonical).toBe(
      `/vehicles/${encodeURIComponent("恐龍車")}`,
    );
  });
});
