import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { getNextStory, getRelated, storiesByNewest } from "@/data/content";
import RelatedStories from "./RelatedStories";

vi.stubGlobal("React", React);

describe("RelatedStories", () => {
  const latest = storiesByNewest()[0];
  const next = getNextStory(latest.slug)!;
  const related = getRelated(latest.slug, 3, [next.slug]);

  it("有接著聽那一集時：這一區用「接著聽」命名，相關故事另有小標", () => {
    const html = renderToStaticMarkup(<RelatedStories stories={related} nextStory={next} />);
    expect(html).toContain('aria-labelledby="story-next-heading"');
    expect(html).toMatch(/<h2 id="story-next-heading"[^>]*>接著聽<\/h2>/);
    expect(html).toMatch(/<h3 id="story-related-heading"[^>]*>相關故事<\/h3>/);
    expect(html).toContain('aria-labelledby="story-related-heading"');
    expect(html).not.toContain("下一集");
  });

  it("沒有接著聽（最舊一集）時：不放「接著聽」標題，也不多一個小標", () => {
    const html = renderToStaticMarkup(<RelatedStories stories={related} />);
    expect(html).toContain('aria-label="相關故事"');
    expect(html).not.toContain("接著聽");
    expect(html).not.toContain("<h3");
  });

  it("什麼都沒有就不渲染", () => {
    expect(renderToStaticMarkup(<RelatedStories stories={[]} />)).toBe("");
  });
});
