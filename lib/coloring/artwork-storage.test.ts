import "fake-indexeddb/auto";
import { describe, expect, test } from "vitest";
import {
  deleteColoringArtwork,
  listColoredPageIds,
  saveColoringArtwork,
} from "./artwork-storage";

const blob = () => new Blob(["x"], { type: "image/png" });

function artwork(id: string, pageId: string) {
  return {
    id,
    pageId,
    title: pageId,
    lineArtRevision: 1,
    createdAt: Date.now(),
    compositeBlob: blob(),
    thumbnailBlob: blob(),
  };
}

describe("listColoredPageIds", () => {
  test("列出收藏過的頁面，刪掉作品後跟著消失", async () => {
    expect(await listColoredPageIds()).toEqual(new Set());
    await saveColoringArtwork(artwork("a1", "char-猛猛"));
    await saveColoringArtwork(artwork("a2", "char-猛猛"));
    await saveColoringArtwork(artwork("a3", "scene-ep-3-05"));
    expect(await listColoredPageIds()).toEqual(new Set(["char-猛猛", "scene-ep-3-05"]));
    await deleteColoringArtwork("a3");
    expect(await listColoredPageIds()).toEqual(new Set(["char-猛猛"]));
  });
});
