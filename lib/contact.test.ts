import { afterEach, describe, expect, it, vi } from "vitest";
import { CONTACT_EMAIL, contactHref, isContactExternal } from "./contact";

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

describe("isContactExternal", () => {
  it("http(s) 為外連，mailto 不是", () => {
    expect(isContactExternal("https://forms.example.com")).toBe(true);
    expect(isContactExternal("http://forms.example.com")).toBe(true);
    expect(isContactExternal(`mailto:${CONTACT_EMAIL}`)).toBe(false);
  });
});
