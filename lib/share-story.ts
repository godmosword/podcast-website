import { getSiteUrl } from "@/lib/site-url";

export function storyShareUrl(slug: string): string {
  return `${getSiteUrl()}/story/${slug}`;
}

/** LINE 分享文案模板（標題 + 大綱或預設句 + 官網連結）。 */
export function storyLineShareText(params: {
  ep: number;
  title: string;
  slug: string;
  summary?: string;
}): string {
  const url = storyShareUrl(params.slug);
  const headline = `《車車遊樂園》EP ${params.ep} ${params.title}`;
  const teaser =
    params.summary?.trim() || "睡前看圖聽故事，一起來聽！";
  return `${headline}\n${teaser}\n${url}`;
}

export function lineShareUrl(text: string): string {
  return `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
}
