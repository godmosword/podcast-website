import { describe, expect, it } from "vitest";
import { GET as getStories } from "./route";
import { listStoriesApi } from "@/lib/api-v1";

describe("GET /api/v1/stories", () => {
  it("回 200、stories 陣列、Cache-Control", async () => {
    const res = await getStories();
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toContain("public");
    const body = (await res.json()) as { stories: unknown[] };
    expect(Array.isArray(body.stories)).toBe(true);
    expect(body.stories.length).toBe(listStoriesApi().length);
    expect(body.stories.length).toBeGreaterThan(0);
    const first = body.stories[0] as { slug: string; coverUrl: string };
    expect(first.slug).toBeTruthy();
    expect(first.coverUrl).toMatch(/^https?:\/\//);
  });
});
