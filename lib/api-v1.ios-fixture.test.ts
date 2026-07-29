import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  getChannelMetaApi,
  getStoryApi,
  listStoriesApi,
} from "@/lib/api-v1";

const SITE = "https://podcast-website-mu.vercel.app";
const FIXTURES = join(process.cwd(), "ios/Fixtures");

function readJson(name: string): unknown {
  return JSON.parse(readFileSync(join(FIXTURES, name), "utf8"));
}

function writeJson(name: string, value: unknown): void {
  writeFileSync(join(FIXTURES, name), `${JSON.stringify(value, null, 2)}\n`);
}

describe("iOS Fixtures ↔ api-v1 契約", () => {
  it("Fixtures 目錄存在", () => {
    expect(existsSync(FIXTURES)).toBe(true);
  });

  it("story-list.sample.json 對齊 listStoriesApi 前 3 筆", () => {
    const expected = { stories: listStoriesApi(SITE).slice(0, 3) };
    if (process.env.UPDATE_IOS_FIXTURES === "1") {
      writeJson("story-list.sample.json", expected);
    }
    expect(readJson("story-list.sample.json")).toEqual(expected);
  });

  it("story-detail.sample.json 對齊最新一集詳情", () => {
    const slug = listStoriesApi(SITE)[0]?.slug;
    expect(slug).toBeTruthy();
    const expected = getStoryApi(slug!, SITE);
    expect(expected).not.toBeNull();
    if (process.env.UPDATE_IOS_FIXTURES === "1") {
      writeJson("story-detail.sample.json", expected);
    }
    expect(readJson("story-detail.sample.json")).toEqual(expected);
  });

  it("meta.sample.json 對齊 getChannelMetaApi", () => {
    const expected = getChannelMetaApi(SITE);
    if (process.env.UPDATE_IOS_FIXTURES === "1") {
      writeJson("meta.sample.json", expected);
    }
    expect(readJson("meta.sample.json")).toEqual(expected);
  });

  it("Swift APIModels 宣告了契約必要欄位", () => {
    const models = readFileSync(
      join(process.cwd(), "ios/CheCheCar/Models/APIModels.swift"),
      "utf8",
    );
    for (const field of [
      "coverUrl",
      "audioUrl",
      "pageImageUrls",
      "captionTimes",
      "hasTranscriptVtt",
      "transcriptVttUrl",
      "reflectionPrompt",
    ]) {
      expect(models, field).toContain(field);
    }
  });
});
