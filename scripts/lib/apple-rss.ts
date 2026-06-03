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

/** 從 RSS 描述產生站內摘要（去除 SoundOn 等託管尾註）。 */
export function cleanEpisodeSummary(
  description: string,
  maxLen = 500,
): string | undefined {
  let text = stripHtml(description);
  text = text.replace(/\s*--\s*Hosting provided by SoundOn.*$/i, "");
  const promoIdx = text.search(/這篇為真實故事改編/);
  if (promoIdx >= 0) {
    text = text.slice(0, promoIdx);
  }
  text = text.trim();
  if (!text) return undefined;
  return text.length > maxLen ? text.slice(0, maxLen) : text;
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

  return asArray(channel.item as Record<string, XmlValue> | undefined)
    .map((item) => itemToEpisode(item, channelImage))
    .filter((ep): ep is RssEpisode => ep != null);
}

export function slugForEpisode(ep: number): string {
  return `ep-${ep}`;
}
