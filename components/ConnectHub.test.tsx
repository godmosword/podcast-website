import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

vi.stubGlobal("React", React);

describe("ConnectHub", () => {
  test("平台區塊標題為頻道，不顯示 Podcast App 副標", async () => {
    const { default: ConnectHub } = await import("./ConnectHub");
    const html = renderToStaticMarkup(<ConnectHub />);
    expect(html).toContain("頻道");
    expect(html).not.toContain("訂閱後，新集會自動出現在你的 Podcast App");
    expect(html).toMatch(/<h2[^>]*id="connect-listen"[^>]*>[\s\S]*頻道/);
  });
});
