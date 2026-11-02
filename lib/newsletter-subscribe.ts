/**
 * 電子報訂閱寫進 Notion。
 *
 * 環境變數（只放伺服器，不要寫進前端、也不要在這次部署裡設定）：
 * - `NOTION_TOKEN`：Notion integration token
 * - `NOTION_NEWSLETTER_DB_ID`：資料庫 id
 *
 * 資料庫欄位：
 * - `Email`：email
 * - `訂閱時間`：date
 * - `來源`：rich text
 */
const NOTION_VERSION = "2022-06-28";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SOURCE_LABEL = "網站電子報";

export const NEWSLETTER_HONEYPOT_FIELD = "website";

export type NewsletterSubscribeResult =
  | { ok: true; duplicate?: boolean }
  | { ok: false; reason: "unavailable" | "invalid_email" | "failed" };

export function newsletterSubscribeConfig(): { token: string; databaseId: string } | null {
  const token = process.env.NOTION_TOKEN?.trim() ?? "";
  const databaseId = process.env.NOTION_NEWSLETTER_DB_ID?.trim() ?? "";
  if (!token || !databaseId) return null;
  return { token, databaseId };
}

export function normalizeNewsletterEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const email = raw.trim().toLowerCase();
  if (email.length === 0 || email.length > 254 || !EMAIL_PATTERN.test(email)) return null;
  return email;
}

type NotionFetch = (url: string, init: RequestInit) => Promise<Response>;

function notionHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };
}

async function emailAlreadySubscribed(
  config: { token: string; databaseId: string },
  email: string,
  fetchImpl: NotionFetch,
): Promise<boolean> {
  const response = await fetchImpl(
    `https://api.notion.com/v1/databases/${config.databaseId}/query`,
    {
      method: "POST",
      headers: notionHeaders(config.token),
      body: JSON.stringify({
        page_size: 1,
        filter: { property: "Email", email: { equals: email } },
      }),
    },
  );
  if (!response.ok) {
    throw new Error(`notion query ${response.status}`);
  }
  const payload = (await response.json()) as { results?: unknown[] };
  return (payload.results?.length ?? 0) > 0;
}

async function createSubscriber(
  config: { token: string; databaseId: string },
  email: string,
  fetchImpl: NotionFetch,
): Promise<void> {
  const response = await fetchImpl("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: notionHeaders(config.token),
    body: JSON.stringify({
      parent: { database_id: config.databaseId },
      properties: {
        Email: { email },
        訂閱時間: { date: { start: new Date().toISOString() } },
        來源: {
          rich_text: [{ type: "text", text: { content: SOURCE_LABEL } }],
        },
      },
    }),
  });
  if (!response.ok) {
    throw new Error(`notion create ${response.status}`);
  }
}

export async function subscribeToNewsletter(
  input: { email: unknown; honeypot: unknown },
  fetchImpl: NotionFetch = fetch,
): Promise<NewsletterSubscribeResult> {
  const honeypot = typeof input.honeypot === "string" ? input.honeypot.trim() : "";
  if (honeypot) return { ok: true };

  const config = newsletterSubscribeConfig();
  if (!config) return { ok: false, reason: "unavailable" };

  const email = normalizeNewsletterEmail(input.email);
  if (!email) return { ok: false, reason: "invalid_email" };

  try {
    if (await emailAlreadySubscribed(config, email, fetchImpl)) {
      return { ok: true, duplicate: true };
    }
    await createSubscriber(config, email, fetchImpl);
    return { ok: true };
  } catch {
    return { ok: false, reason: "failed" };
  }
}
