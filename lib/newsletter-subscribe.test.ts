import { afterEach, describe, expect, it, vi } from "vitest";
import {
  normalizeNewsletterEmail,
  subscribeToNewsletter,
} from "./newsletter-subscribe";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("電子報信箱", () => {
  it("收得到的信箱會轉成小寫，空的與不像信箱的拒絕", () => {
    expect(normalizeNewsletterEmail("  Parent@Example.com ")).toBe("parent@example.com");
    expect(normalizeNewsletterEmail("不是信箱")).toBeNull();
    expect(normalizeNewsletterEmail("")).toBeNull();
    expect(normalizeNewsletterEmail(null)).toBeNull();
  });
});

describe("subscribeToNewsletter", () => {
  it("沒有設定 Notion 時不送出", async () => {
    vi.stubEnv("NOTION_TOKEN", "");
    vi.stubEnv("NOTION_NEWSLETTER_DB_ID", "");
    const fetchImpl = vi.fn();
    await expect(
      subscribeToNewsletter({ email: "parent@example.com", honeypot: "" }, fetchImpl),
    ).resolves.toEqual({ ok: false, reason: "unavailable" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("蜜罐有填就假裝成功，不打 Notion", async () => {
    vi.stubEnv("NOTION_TOKEN", "secret");
    vi.stubEnv("NOTION_NEWSLETTER_DB_ID", "db");
    const fetchImpl = vi.fn();
    await expect(
      subscribeToNewsletter({ email: "parent@example.com", honeypot: "https://spam" }, fetchImpl),
    ).resolves.toEqual({ ok: true });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("新信箱會查重後寫入 Email、訂閱時間、來源", async () => {
    vi.stubEnv("NOTION_TOKEN", "secret");
    vi.stubEnv("NOTION_NEWSLETTER_DB_ID", "db-id");
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url).endsWith("/query")) {
        return new Response(JSON.stringify({ results: [] }), { status: 200 });
      }
      expect(init?.method).toBe("POST");
      return new Response("{}", { status: 200 });
    });
    await expect(
      subscribeToNewsletter({ email: "Parent@Example.com", honeypot: "" }, fetchImpl),
    ).resolves.toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    const createInit = fetchImpl.mock.calls[1]?.[1];
    const body = JSON.parse(String(createInit?.body));
    expect(body.properties.Email.email).toBe("parent@example.com");
    expect(body.properties.訂閱時間.date.start).toEqual(expect.any(String));
    expect(body.properties.來源.rich_text[0].text.content).toBe("網站電子報");
  });

  it("已經訂過就不再建一筆", async () => {
    vi.stubEnv("NOTION_TOKEN", "secret");
    vi.stubEnv("NOTION_NEWSLETTER_DB_ID", "db-id");
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ results: [{}] }), { status: 200 }));
    await expect(
      subscribeToNewsletter({ email: "parent@example.com", honeypot: "  " }, fetchImpl),
    ).resolves.toEqual({ ok: true, duplicate: true });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
