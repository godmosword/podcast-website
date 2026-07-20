import { describe, expect, it } from "vitest";
import { allTags, getStoriesByTag } from "@/data/content";
import { topicDefinitionSummary, topicFaqs } from "./topic-geo";

describe("topicDefinitionSummary", () => {
  it("每個主題標籤產生含集數與代表例子的導言", () => {
    const summaries = new Set<string>();
    for (const tag of allTags()) {
      const stories = getStoriesByTag(tag);
      const summary = topicDefinitionSummary(tag, stories);

      expect(summary, tag).toContain(tag);
      expect(summary, tag).toContain(String(stories.length));
      expect(summary, tag).toContain("EP ");
      summaries.add(summary);
    }
    expect(summaries.size).toBeGreaterThan(1);
  });
});

describe("topicFaqs", () => {
  it("每個主題產生 3 題 FAQ", () => {
    const tag = allTags()[0];
    const stories = getStoriesByTag(tag);
    const faqs = topicFaqs(tag, stories);

    expect(faqs).toHaveLength(3);
    expect(faqs[0].question).toContain(tag);
    expect(faqs.every((faq) => faq.question && faq.answer)).toBe(true);
  });
});
