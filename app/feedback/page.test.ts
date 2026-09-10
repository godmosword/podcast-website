import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const PAGE = join(process.cwd(), "app/feedback/page.tsx");

describe("feedback page 契約", () => {
  it("表單與牆不快取，邀請是文字、不放定裝照", () => {
    const source = readFileSync(PAGE, "utf8");
    expect(source).toContain('export const dynamic = "force-dynamic"');
    expect(source).toContain("FeedbackForm available={available}");
    expect(source).toContain("FEEDBACK_PAGE_TITLE_ID");
    expect(source).toContain("FEEDBACK_INVITE_CHILD");
    expect(source).not.toContain("next/image");
    expect(source).not.toContain("getCharacters");
    expect(source).not.toContain("portraitMat");
    expect(source).not.toContain("FEEDBACK_INVITE_LINES");
    expect(source).not.toContain("FEEDBACK_EYEBROW");
  });
});
