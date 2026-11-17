import { describe, expect, it } from "vitest";
import { defaultOgImage } from "@/lib/site-url";
import { pageSocialMetadata } from "./page-social-metadata";

describe("pageSocialMetadata", () => {
  it("沒給圖時用首頁預覽，並帶上寬高與替代文字", () => {
    const meta = pageSocialMetadata({
      title: "關於車車遊樂園",
      description: "說明",
      url: "/about",
      type: "website",
    });

    expect(meta.openGraph?.images).toEqual([defaultOgImage()]);
    expect(meta.twitter?.images).toEqual([defaultOgImage()]);
  });

  it("沿用預設圖但自訂 alt 時仍帶寬高", () => {
    const meta = pageSocialMetadata({
      title: "電子報",
      description: "說明",
      url: "/newsletter/issue",
      type: "article",
      publishedTime: "2026-11-06",
      imageAlt: "這一期的標題",
    });

    expect(meta.openGraph?.images).toEqual([
      { ...defaultOgImage(), alt: "這一期的標題" },
    ]);
  });

  it("有自己的封面時不套用首頁圖的寬高", () => {
    const meta = pageSocialMetadata({
      title: "文章標題",
      description: "說明",
      url: "/for-parents/articles/example",
      type: "article",
      publishedTime: "2026-11-01",
      image: "/parents/example.jpg",
      imageAlt: "文章封面",
    });

    expect(meta.openGraph?.images).toEqual([
      { url: "/parents/example.jpg", alt: "文章封面" },
    ]);
    expect(meta.twitter?.images).toEqual([
      { url: "/parents/example.jpg", alt: "文章封面" },
    ]);
  });
});
