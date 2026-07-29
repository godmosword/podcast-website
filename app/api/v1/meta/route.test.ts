import { describe, expect, it } from "vitest";
import { CHANNEL_TITLE } from "@/lib/feed-constants";
import { GET } from "./route";

describe("GET /api/v1/meta", () => {
  it("回頻道 meta 與平台列表", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      title: string;
      feedUrl: string;
      artworkUrl: string;
      platforms: { label: string; url: string }[];
    };
    expect(body.title).toBe(CHANNEL_TITLE);
    expect(body.feedUrl).toMatch(/\/feed\.xml$/);
    expect(body.artworkUrl).toMatch(/\/mascot\.png$/);
    expect(body.platforms.length).toBeGreaterThan(0);
  });
});
