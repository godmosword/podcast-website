import { describe, expect, it } from "vitest";
import { storiesByNewest } from "@/data/content";
import { GET } from "./route";

describe("GET /api/v1/stories/[slug]", () => {
  it("已知 slug 回詳情與 pageImageUrls", async () => {
    const slug = storiesByNewest()[0].slug;
    const res = await GET(new Request(`http://localhost/api/v1/stories/${slug}`), {
      params: Promise.resolve({ slug }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      slug: string;
      pageImageUrls: string[];
      pageCount: number;
    };
    expect(body.slug).toBe(slug);
    expect(body.pageImageUrls).toHaveLength(body.pageCount);
  });

  it("未知 slug 回 404 { error: not_found }", async () => {
    const res = await GET(
      new Request("http://localhost/api/v1/stories/no-such-ep"),
      { params: Promise.resolve({ slug: "no-such-ep" }) },
    );
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: "not_found" });
  });
});
