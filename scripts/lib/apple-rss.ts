import { XMLParser } from "fast-xml-parser";

export type RssEpisode = {
  guid: string;
  title: string;
  pubDate: string;
  description: string;
  audioUrl: string;
  imageUrl: string | null;
  episode: number | null;
  duration: string | null;
  /** itunes:keywords，逗號分隔之主題／行銷關鍵字。 */
  keywords: string[];
};

type XmlValue = string | number | Record<string, unknown>;

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function text(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  if (typeof value === "object" && value !== null && "#text" in value) {
    return text((value as Record<string, unknown>)["#text"]);
  }
  return "";
}

function attrHref(node: unknown): string | null {
  if (node == null) return null;
  if (typeof node === "string") return node.trim() || null;
  if (typeof node === "object" && node !== null) {
    const href = (node as Record<string, unknown>)["@_href"];
    if (typeof href === "string" && href.trim()) return href.trim();
  }
  return null;
}

/** 去除 HTML 標籤，壓成單行摘要。 */
export function stripHtml(html: string): string {
  return html
    .replace(/<!\[CDATA\[/gi, "")
    .replace(/\]\]>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeBasicEntities(text: string): string {
  return text
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/gi, "'");
}

/** 站內摘要 Unicode 字元上限（以 code point 計，非 UTF-16 length）。 */
export const EPISODE_SUMMARY_MAX_LEN = 68;

/** 家長向 emoji 後接詞（👶／🫶🏻 須與此 lookahead 配對才視為宣傳 marker）。 */
const PARENT_EMOJI_LOOKAHEAD =
  "(?:搞笑事件|Bonbon|陪孩子|這集|回想|最近|最後還有|我們可以|想說的話)";

/** SoundOn / 節目後台常見的宣傳尾段起點（取最早出現處截斷）。 */
const SUMMARY_PROMO_MARKERS: RegExp[] = [
  /這篇為真實故事改編/,
  /喜歡《車車遊樂園》/,
  /🏎️這集小小賽車配音員/,
  /歡迎(?:大家)?留言/u,
  /五星(?:留言好評|好評|的鼓勵)/u,
  /馬米是非專業(?:錄音者)?/u,
  /希望大家給/u,
  /也可許願/u,
  /謝謝大家支持Bonbon/u,
  /車車遊樂園\s*h\s*t\s*t\s*p/iu,
  /link\s*\.?\s*tr\s*\.?\s*ee/iu,
  new RegExp(`(?:^|\\s)👶(?=${PARENT_EMOJI_LOOKAHEAD})`, "u"),
  new RegExp(`(?:^|\\s)🫶🏻(?=${PARENT_EMOJI_LOOKAHEAD})`, "u"),
];

const SENTENCE_END_CHARS = new Set(["。", "！", "？", "!", "?"]);
const SECONDARY_BREAK_CHARS = new Set(["，", "、"]);
const ELLIPSIS = "…";

/** 截斷宣傳尾段（marker 取最早 match）。 */
function trimSummaryPromo(text: string): string {
  let cutAt = text.length;
  for (const marker of SUMMARY_PROMO_MARKERS) {
    const idx = text.search(marker);
    if (idx >= 0) cutAt = Math.min(cutAt, idx);
  }
  return text.slice(0, cutAt).trim();
}

/** 保留最多 maxSentences 個以句號／驚嘆號結尾的句單位；不足則保留後續文字供長度裁切。 */
function limitSentences(text: string, maxSentences = 3): string {
  const re = /[^。！？!?]*[。！？!?]/g;
  const sentences: string[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (sentences.length >= maxSentences) break;
    sentences.push(match[0]);
    lastIndex = re.lastIndex;
  }

  if (sentences.length >= maxSentences) {
    return sentences.join("").trim();
  }

  return (sentences.join("") + text.slice(lastIndex)).trim();
}

/**
 * 依 Unicode 上限裁切：優先在 maxLen 內最後一句界切斷（前綴 ≥40 字不補省略號）；
 * 其次退到逗號／頓號；否則硬切 maxLen−1 字並補 …（省略號計入上限）。
 */
function lastBreakBefore(
  chars: string[],
  maxLen: number,
  breaks: ReadonlySet<string>,
): number {
  for (let i = Math.min(chars.length, maxLen) - 1; i >= 0; i--) {
    if (breaks.has(chars[i])) return i;
  }
  return -1;
}

function truncateToMaxLen(text: string, maxLen: number): string {
  const chars = Array.from(text);
  if (chars.length <= maxLen) return text;

  const sentenceEnd = lastBreakBefore(chars, maxLen, SENTENCE_END_CHARS);
  if (sentenceEnd >= 0 && sentenceEnd + 1 >= 40) {
    return chars.slice(0, sentenceEnd + 1).join("");
  }

  const commaEnd = lastBreakBefore(chars, maxLen, SECONDARY_BREAK_CHARS);
  if (commaEnd >= 0 && commaEnd + 1 >= 40) {
    return chars.slice(0, commaEnd + 1).join("");
  }

  if (maxLen <= 1) return ELLIPSIS.slice(0, maxLen);
  return chars.slice(0, maxLen - 1).join("") + ELLIPSIS;
}

/** 從 RSS 描述產生站內摘要（去除 SoundOn 等託管尾註與節目宣傳段）。 */
export function cleanEpisodeSummary(
  description: string,
  maxLen = EPISODE_SUMMARY_MAX_LEN,
): string | undefined {
  let text = stripHtml(description);
  text = decodeBasicEntities(text);
  text = text.replace(/\s*--\s*Hosting provided by SoundOn.*$/i, "");
  text = trimSummaryPromo(text);
  text = text.replace(/\s+/g, " ").trim();
  if (!text) return undefined;
  text = limitSentences(text, 3);
  text = truncateToMaxLen(text, maxLen);
  if (!text) return undefined;
  return text;
}

/** 將 RSS pubDate 轉成 YYYY-MM-DD（UTC 日曆日）。 */
export function pubDateToIsoDate(pubDate: string): string {
  const d = new Date(pubDate);
  if (Number.isNaN(d.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  return d.toISOString().slice(0, 10);
}

/** 將 itunes:duration（秒數或 HH:MM:SS / MM:SS）轉成站內顯示格式。 */
export function formatItunesDuration(raw: unknown): string | null {
  if (raw == null || raw === "") return null;
  if (typeof raw === "number" && raw > 0) {
    const sec = Math.floor(raw);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }
  const str = String(raw).trim();
  if (/^\d+$/.test(str)) {
    return formatItunesDuration(Number(str));
  }
  const parts = str.split(":").map((p) => parseInt(p, 10));
  if (parts.some((n) => Number.isNaN(n))) return str;
  if (parts.length === 3) {
    const [h, m, s] = parts;
    const total = h * 3600 + m * 60 + s;
    const mm = Math.floor(total / 60);
    const ss = total % 60;
    return `${mm}:${String(ss).padStart(2, "0")}`;
  }
  if (parts.length === 2) {
    const [m, s] = parts;
    return `${m}:${String(s).padStart(2, "0")}`;
  }
  return str;
}

function parseEpisode(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  const n = typeof raw === "number" ? raw : parseInt(String(raw), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** 解析 itunes:keywords（SoundOn 後台設定的逗號分隔關鍵字）。 */
export function parseItunesKeywords(raw: unknown): string[] {
  const str = text(raw);
  if (!str) return [];
  return str
    .split(/[,，、]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function itemToEpisode(item: Record<string, XmlValue>, channelImage: string | null): RssEpisode | null {
  const guid = text(item.guid) || text(item.link);
  const title = text(item.title);
  const enclosure = item.enclosure;
  let audioUrl = "";
  if (enclosure && typeof enclosure === "object" && !Array.isArray(enclosure)) {
    const url = (enclosure as Record<string, unknown>)["@_url"];
    if (typeof url === "string") audioUrl = url.trim();
  }
  if (!guid || !title || !audioUrl) return null;

  const itunes = item.itunes as Record<string, unknown> | undefined;
  const itunesEpisode = item["itunes:episode"] ?? itunes?.episode;
  const itunesDuration = item["itunes:duration"] ?? itunes?.duration;
  const itunesImage = item["itunes:image"] ?? itunes?.image;
  const itunesKeywords = item["itunes:keywords"] ?? itunes?.keywords;

  const imageUrl =
    attrHref(itunesImage) ??
    channelImage;

  return {
    guid,
    title,
    pubDate: text(item.pubDate),
    description: text(item.description) || text(item["itunes:summary"]),
    audioUrl,
    imageUrl,
    episode: parseEpisode(itunesEpisode),
    duration: formatItunesDuration(itunesDuration),
    keywords: parseItunesKeywords(itunesKeywords),
  };
}

/** 解析 podcast RSS XML 字串為集數列表（不含 channel 層級邏輯）。 */
export function parseRssEpisodes(xml: string): RssEpisode[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    trimValues: true,
    isArray: (name) => name === "item",
  });
  const doc = parser.parse(xml) as Record<string, unknown>;
  const channel = (doc.rss as Record<string, unknown> | undefined)?.channel as
    | Record<string, XmlValue>
    | undefined;
  if (!channel) return [];

  const channelImage =
    attrHref(channel["itunes:image"]) ??
    attrHref((channel.image as Record<string, unknown> | undefined)?.url);

  return asArray<Record<string, XmlValue>>(
    channel.item as
      | Record<string, XmlValue>
      | Record<string, XmlValue>[]
      | undefined,
  )
    .map((item) => itemToEpisode(item, channelImage))
    .filter((ep): ep is RssEpisode => ep != null);
}

export function slugForEpisode(ep: number): string {
  return `ep-${ep}`;
}
