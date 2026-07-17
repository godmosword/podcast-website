import { getSiteUrl } from "@/lib/site-url";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export function isSubscribeEmailConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() && process.env.SUBSCRIBE_FROM_EMAIL?.trim(),
  );
}

/**
 * 寄送新集通知確認信。provider 只負責寄信，會員登入／付款驗證另列 STEM-P4。
 */
export async function sendSubscribeConfirmation(input: {
  email: string;
  token: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.SUBSCRIBE_FROM_EMAIL?.trim();
  if (!apiKey || !from) throw new Error("訂閱確認信 provider 未設定");

  const confirmUrl = new URL("/api/subscribe/confirm", getSiteUrl());
  confirmUrl.searchParams.set("token", input.token);

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.email],
      subject: "請確認訂閱《車車遊樂園》新集通知",
      text: `請點擊以下連結確認訂閱：${confirmUrl.toString()}\n\n若不是你申請的，可忽略這封信。`,
      html: `<p>請點擊以下連結確認訂閱《車車遊樂園》新集通知：</p><p><a href="${confirmUrl.toString()}">確認訂閱</a></p><p>若不是你申請的，可忽略這封信。</p>`,
    }),
  });

  if (!response.ok) {
    throw new Error(`訂閱確認信寄送失敗：${response.status}`);
  }
}
