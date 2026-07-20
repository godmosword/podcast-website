import { describe, expect, it, vi } from "vitest";
import { getSubtitles } from "@/lib/subtitles";
import { hasFullTranscript } from "@/lib/transcript";
import { storiesByNewest } from "@/data/content";
import { GET } from "@/app/story/[slug]/transcript.vtt/route";

describe("GET /story/[slug]/transcript.vtt", () => {
  it("有完整逐字稿的集回 200 與 text/vtt", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const story = storiesByNewest().find(hasFullTranscript);
    expect(story).toBeDefined();

    const res = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ slug: story!.slug }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/vtt; charset=utf-8");
    const body = await res.text();
    expect(body.startsWith("WEBVTT")).toBe(true);
    const subs = getSubtitles(story!.slug);
    expect(subs?.[0]?.text).toBeDefined();
    expect(body).toContain(subs![0].text);

    vi.unstubAllEnvs();
  });

  it("不存在的 slug 回 404", async () => {
    const res = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ slug: "no-such-episode" }),
    });
    expect(res.status).toBe(404);
  });

  it("僅場景 captions、無 subtitles 側車回 404", async () => {
    const res = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ slug: "ep-scene-only-fixture" }),
    });
    expect(res.status).toBe(404);
  });

  it("legacy slug alias 仍回 200 VTT（canonical subtitles）", async () => {
    const res = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ slug: "excavator" }),
    });
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body.startsWith("WEBVTT")).toBe(true);
    const ranges = body.match(
      /\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}/g,
    );
    for (const range of ranges ?? []) {
      const [startStr, endStr] = range.split(" --> ");
      expect(startStr).not.toBe(endStr);
    }
  });
});
