import type { SyncRunReport } from "./sync-report";

export type IssueLinks = Record<string, string>;

export type NotifyCopy = {
  subject: string;
  lineText: string;
  emailText: string;
  emailHtml: string;
};

function siteBase(): string {
  return (
    process.env.NOTIFY_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "https://podcast-website-mu.vercel.app"
  ).replace(/\/+$/, "");
}

function subtitleShort(slug: string, report: SyncRunReport): string {
  if (report.subtitlesCreated.includes(slug)) return "字幕已轉錄（草稿，請校對）";
  if (report.subtitlesMissing.includes(slug)) return "字幕缺側車檔";
  return "字幕已有側車檔";
}

/** 有新集時才推播（避免每 15 分鐘 metadata 微調洗版）。 */
export function shouldMobileNotify(report: SyncRunReport): boolean {
  return report.newEpisodes.length > 0;
}

export function buildNotifyCopy(
  report: SyncRunReport,
  issueLinks: IssueLinks = {},
): NotifyCopy {
  const base = siteBase();
  const slugs = report.newEpisodes.map((e) => e.slug);
  const subject =
    slugs.length === 1
      ? `[車車遊樂園] 新集 ${slugs[0]} 已上線（待生圖）`
      : `[車車遊樂園] ${slugs.length} 集新故事已上線（待生圖）`;

  const lines: string[] = ["🚗 車車遊樂園 · Apple 同步完成", ""];
  const htmlParts: string[] = [
    "<h2>🚗 車車遊樂園 · Apple 同步完成</h2>",
    "<ul>",
  ];

  for (const ep of report.newEpisodes) {
    const storyUrl = `${base}/story/${ep.slug}`;
    const issueUrl = issueLinks[ep.slug];
    lines.push(`【${ep.slug}】EP${ep.ep} ${ep.title}`);
    lines.push(`字幕：${subtitleShort(ep.slug, report)}`);
    lines.push(`MVP：${storyUrl}`);
    if (issueUrl) lines.push(`Issue：${issueUrl}`);
    if (/^ep-\d+$/.test(ep.slug)) {
      lines.push(`生圖：npm run illustrate -- ${ep.slug}`);
    }
    lines.push("");

    htmlParts.push(
      `<li><strong>${ep.slug}</strong> EP${ep.ep} ${escapeHtml(ep.title)}<br>` +
        `字幕：${escapeHtml(subtitleShort(ep.slug, report))}<br>` +
        `<a href="${storyUrl}">站上 MVP</a>` +
        (issueUrl ? ` · <a href="${issueUrl}">GitHub Issue</a>` : "") +
        (/^ep-\d+$/.test(ep.slug)
          ? `<br><code>npm run illustrate -- ${ep.slug}</code>`
          : "") +
        `</li>`,
    );
  }

  htmlParts.push("</ul>");
  htmlParts.push(
    "<p><small>生圖在本機執行（需 OPENAI_API_KEY），審 contact.html 後 --approve。</small></p>",
  );

  lines.push("待辦：校對字幕 → illustrate → 審圖 → approve → push");

  return {
    subject,
    lineText: lines.join("\n").trim(),
    emailText: lines.join("\n").trim(),
    emailHtml: htmlParts.join("\n"),
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseLineRecipients(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** LINE Messaging API push（to 可為 userId / groupId / roomId）。 */
export async function sendLinePush(copy: NotifyCopy): Promise<void> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim();
  const recipients = parseLineRecipients(process.env.LINE_PUSH_TO);
  if (!token || recipients.length === 0) {
    console.log("LINE：未設 LINE_CHANNEL_ACCESS_TOKEN 或 LINE_PUSH_TO，略過。");
    return;
  }

  const body =
    recipients.length === 1
      ? {
          to: recipients[0],
          messages: [{ type: "text", text: copy.lineText }],
        }
      : {
          to: recipients,
          messages: [{ type: "text", text: copy.lineText }],
        };

  const endpoint =
    recipients.length === 1
      ? "https://api.line.me/v2/bot/message/push"
      : "https://api.line.me/v2/bot/message/multicast";

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`LINE API ${res.status}: ${errText}`);
  }
  console.log(`LINE：已推播至 ${recipients.length} 個對象`);
}

export async function sendNotifyEmail(copy: NotifyCopy): Promise<void> {
  const to = process.env.NOTIFY_EMAIL_TO?.trim();
  if (!to) {
    console.log("Email：未設 NOTIFY_EMAIL_TO，略過。");
    return;
  }

  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (resendKey) {
    await sendViaResend(copy, resendKey, to);
    return;
  }

  if (process.env.SMTP_HOST?.trim()) {
    await sendViaSmtp(copy, to);
    return;
  }

  console.log("Email：未設 RESEND_API_KEY 或 SMTP_HOST，略過。");
}

async function sendViaResend(
  copy: NotifyCopy,
  apiKey: string,
  to: string,
): Promise<void> {
  const from =
    process.env.NOTIFY_EMAIL_FROM?.trim() || "車車遊樂園 <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: to.split(/[,\s]+/).filter(Boolean),
      subject: copy.subject,
      text: copy.emailText,
      html: copy.emailHtml,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Resend API ${res.status}: ${errText}`);
  }
  console.log(`Email：已透過 Resend 寄至 ${to}`);
}

async function sendViaSmtp(copy: NotifyCopy, to: string): Promise<void> {
  const host = process.env.SMTP_HOST!.trim();
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  const secure = process.env.SMTP_SECURE === "1" || port === 465;
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from =
    process.env.NOTIFY_EMAIL_FROM?.trim() || user || "noreply@chechecar.local";

  const { default: nodemailer } = await import("nodemailer");
  const transport = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  });

  await transport.sendMail({
    from,
    to: to.split(/[,\s]+/).filter(Boolean),
    subject: copy.subject,
    text: copy.emailText,
    html: copy.emailHtml,
  });
  console.log(`Email：已透過 SMTP（${host}）寄至 ${to}`);
}

export async function sendMobileNotifications(
  report: SyncRunReport,
  issueLinks: IssueLinks = {},
): Promise<void> {
  if (!shouldMobileNotify(report)) {
    console.log("推播：無新集，略過 LINE／Email。");
    return;
  }

  const copy = buildNotifyCopy(report, issueLinks);

  try {
    await sendLinePush(copy);
  } catch (err) {
    console.warn(`LINE 推播失敗（不阻擋 deploy）：${(err as Error).message}`);
  }

  try {
    await sendNotifyEmail(copy);
  } catch (err) {
    console.warn(`Email 推播失敗（不阻擋 deploy）：${(err as Error).message}`);
  }
}
