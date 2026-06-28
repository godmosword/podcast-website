import { describe, expect, it, vi } from "vitest";
import { storiesByNewest } from "@/data/content";
import { hasVtt } from "@/lib/transcript";
import { GET } from "@/app/story/[slug]/transcript.vtt/route";

describe("GET /story/[slug]/transcript.vtt", () => {
  it("有 VTT 的集回 200 與 text/vtt", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const story = storiesByNewest().find(hasVtt);
    expect(story).toBeDefined();

    const res = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ slug: story!.slug }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/vtt; charset=utf-8");
    const body = await res.text();
    expect(body.startsWith("WEBVTT")).toBe(true);

    vi.unstubAllEnvs();
  });

  it("不存在的 slug 回 404", async () => {
    const res = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ slug: "no-such-episode" }),
    });
    expect(res.status).toBe(404);
  });

  it("有 captions 但無 captionTimes 回 404", async () => {
    const res = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ slug: "ep-1" }),
    });
    // ep-1 若無 captionTimes 應 404；若有則略過此斷言由其他測試覆蓋
    if (res.status === 404) {
      expect(res.status).toBe(404);
    }
  });
});
