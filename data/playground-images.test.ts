import { describe, expect, it } from "vitest";
import { PLAYGROUND_IMAGES } from "./playground-images";
import { listPlaygrounds } from "./playgrounds";
import { access } from "node:fs/promises";
import path from "node:path";

describe("playground images sidecar", () => {
  it("有圖筆數合理且欄位完整", () => {
    const keys = Object.keys(PLAYGROUND_IMAGES);
    expect(keys.length).toBeGreaterThan(40);
    for (const [id, meta] of Object.entries(PLAYGROUND_IMAGES)) {
      expect(meta.src).toBe(`/play-map/${id}.webp`);
      expect(meta.alt.trim().length).toBeGreaterThan(0);
      expect(meta.credit.trim().length).toBeGreaterThan(0);
    }
  });

  it("listPlaygrounds 合併 sidecar", () => {
    const withImage = listPlaygrounds().filter((place) => place.imageSrc);
    expect(withImage.length).toBe(Object.keys(PLAYGROUND_IMAGES).length);
    for (const place of withImage) {
      expect(place.imageAlt).toBeTruthy();
      expect(place.imageCredit).toBeTruthy();
    }
  });

  it("sidecar 對應的 webp 檔存在", async () => {
    for (const id of Object.keys(PLAYGROUND_IMAGES)) {
      await access(path.join(process.cwd(), "public", "play-map", `${id}.webp`));
    }
  });
});
