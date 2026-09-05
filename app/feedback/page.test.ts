import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const PAGE = join(process.cwd(), "app/feedback/page.tsx");

describe("feedback page 契約", () => {
  it("表單與牆不快取，且邀請是段落不是六行短句", () => {
    const source = readFileSync(PAGE, "utf8");
    expect(source).toContain('export const dynamic = "force-dynamic"');
    expect(source).toContain("FeedbackForm available={available}");
    expect(source).toContain("FEEDBACK_INVITE_CHILD");
    expect(source).toContain("FEEDBACK_REVIEW_LEAD");
    expect(source).not.toContain("FEEDBACK_INVITE_LINES");
  });
});
