import { getSiteUrl } from "@/lib/site-url";
import { SUBSCRIBE_CONFIRM_EMAIL_SUBJECT } from "@/lib/subscribe-copy";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export function isSubscribeEmailConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() && process.env.SUBSCRIBE_FROM_EMAIL?.trim(),
  );
}

/**
 * 寄送名單確認信（驗證信箱）。不是新集上線通知；ESP 另案。
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
      subject: SUBSCRIBE_CONFIRM_EMAIL_SUBJECT,
      text: `請點擊以下連結完成信箱確認（目前只收名單，不寄新集上線信）：${confirmUrl.toString()}\n\n若不是你申請的，可忽略這封信。`,
      html: `<p>請點擊以下連結完成信箱確認。目前只收名單，不寄新集上線信：</p><p><a href="${confirmUrl.toString()}">確認加入名單</a></p><p>若不是你申請的，可忽略這封信。</p>`,
    }),
  });

  if (!response.ok) {
    throw new Error(`訂閱確認信寄送失敗：${response.status}`);
  }
}
