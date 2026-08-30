import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CONTACT_EMAIL,
  contactHref,
  feedbackHref,
  isContactExternal,
} from "./contact";

describe("contactHref", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("未設表單 URL 時回傳 mailto", () => {
    vi.stubEnv("NEXT_PUBLIC_CONTACT_FORM_URL", "");
    expect(contactHref()).toBe(`mailto:${CONTACT_EMAIL}`);
  });

  it("有表單 URL 時優先使用並 trim", () => {
    vi.stubEnv("NEXT_PUBLIC_CONTACT_FORM_URL", "  https://forms.example.com/contact  ");
    expect(contactHref()).toBe("https://forms.example.com/contact");
  });
});

describe("feedbackHref", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("未設表單 URL 時降級為帶主旨的 mailto（恆有目的地）", () => {
    vi.stubEnv("NEXT_PUBLIC_FEEDBACK_FORM_URL", "");
    expect(feedbackHref()).toBe(
      `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("留言給車車遊樂園")}`,
    );
  });

  it("有表單 URL 時優先使用並 trim", () => {
    vi.stubEnv(
      "NEXT_PUBLIC_FEEDBACK_FORM_URL",
      "  https://forms.example.com/feedback  ",
    );
    expect(feedbackHref()).toBe("https://forms.example.com/feedback");
  });

  it("與 contactHref 各自獨立，不共用同一個 env", () => {
    vi.stubEnv("NEXT_PUBLIC_CONTACT_FORM_URL", "https://forms.example.com/contact");
    vi.stubEnv("NEXT_PUBLIC_FEEDBACK_FORM_URL", "");
    expect(contactHref()).toBe("https://forms.example.com/contact");
    expect(feedbackHref()).toContain("mailto:");
  });
});

describe("isContactExternal", () => {
  it("http(s) 為外連，mailto 不是", () => {
    expect(isContactExternal("https://forms.example.com")).toBe(true);
    expect(isContactExternal("http://forms.example.com")).toBe(true);
    expect(isContactExternal(`mailto:${CONTACT_EMAIL}`)).toBe(false);
  });
});
