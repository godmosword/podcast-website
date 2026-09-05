import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CONTACT_EMAIL,
  contactHref,
  feedbackHref,
  feedbackMailtoHref,
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

  it("固定回站內 /feedback，不被 FEEDBACK_FORM_URL 覆寫", () => {
    vi.stubEnv("NEXT_PUBLIC_FEEDBACK_FORM_URL", "https://forms.example.com/feedback");
    expect(feedbackHref()).toBe("/feedback");
  });

  it("未設外連表單時仍是 /feedback（頁面即目的地）", () => {
    vi.stubEnv("NEXT_PUBLIC_FEEDBACK_FORM_URL", "");
    expect(feedbackHref()).toBe("/feedback");
  });

  it("與 contactHref 各自獨立", () => {
    vi.stubEnv("NEXT_PUBLIC_CONTACT_FORM_URL", "https://forms.example.com/contact");
    expect(contactHref()).toBe("https://forms.example.com/contact");
    expect(feedbackHref()).toBe("/feedback");
  });
});

describe("feedbackMailtoHref", () => {
  it("給表單降級用，帶主旨", () => {
    expect(feedbackMailtoHref()).toBe(
      `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("留言給車車遊樂園")}`,
    );
  });
});

describe("isContactExternal", () => {
  it("http(s) 為外連，mailto 與站內路徑不是", () => {
    expect(isContactExternal("https://forms.example.com")).toBe(true);
    expect(isContactExternal("http://forms.example.com")).toBe(true);
    expect(isContactExternal(`mailto:${CONTACT_EMAIL}`)).toBe(false);
    expect(isContactExternal("/feedback")).toBe(false);
  });
});
