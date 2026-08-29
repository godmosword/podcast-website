import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

vi.stubGlobal("React", React);

describe("ConnectHub", () => {
  test("平台區塊標題為頻道，社群區塊標題為社群", async () => {
    const { default: ConnectHub } = await import("./ConnectHub");
    const html = renderToStaticMarkup(<ConnectHub />);
    expect(html).toContain("頻道");
    expect(html).not.toContain("訂閱後，新集會自動出現在你的 Podcast App");
    expect(html).toMatch(/<h2[^>]*id="connect-listen"[^>]*>[\s\S]*頻道/);
    expect(html).toMatch(/<h2[^>]*id="connect-follow"[^>]*>[\s\S]*社群/);
    expect(html).not.toContain("訂閱追蹤");
  });
});
