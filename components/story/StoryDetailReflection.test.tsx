import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import StoryDetailReflection from "./StoryDetailReflection";

vi.stubGlobal("React", React);

describe("StoryDetailReflection", () => {
  it("預設只顯示想聊一下，不渲染家長句", () => {
    const html = renderToStaticMarkup(
      <StoryDetailReflection
        slug="ep-1"
        child="你最喜歡哪一台車？"
        parentFollowUp="可以問孩子為什麼喜歡。"
      />,
    );
    expect(html).toContain("想聊一下");
    expect(html).not.toContain("給家長：");
    expect(html).not.toContain("可以問孩子為什麼喜歡");
  });
});
