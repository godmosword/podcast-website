import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import ParentTrustStrip from "./ParentTrustStrip";

vi.stubGlobal("React", React);

describe("ParentTrustStrip", () => {
  it("renders the parent trust signals and privacy link", () => {
    const html = renderToStaticMarkup(<ParentTrustStrip />);

    expect(html).toContain("無廣告");
    expect(html).toContain("不收孩子帳號");
    expect(html).toContain("進度留在這台裝置");
    expect(html).toContain("外連會清楚標示");
    expect(html).toContain('href="/legal#privacy"');
  });
});
