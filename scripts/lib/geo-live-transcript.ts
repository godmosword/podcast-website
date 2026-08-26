/**
 * GEO live 煙霧：最新集逐字稿預期。
 * 與 RSS／JSON-LD 契約對齊——只有 hasFullTranscript 才宣告 VTT。
 * MVP 無字幕側車時，不得要求 live `/transcript.vtt` 200。
 */

export type TranscriptLiveMode = "require" | "forbid";

export function transcriptLiveMode(hasSidecar: boolean): TranscriptLiveMode {
  return hasSidecar ? "require" : "forbid";
}

/** 取 RSS 第一個 `<item>`（本站 feed 依最新集排序）。 */
export function firstRssItemXml(feedXml: string): string | null {
  const start = feedXml.indexOf("<item>");
  if (start < 0) return null;
  const end = feedXml.indexOf("</item>", start);
  if (end < 0) return null;
  return feedXml.slice(start, end + "</item>".length);
}

export function rssHasPodcastTranscript(
  xml: string,
  transcriptUrl: string,
): boolean {
  return xml.includes(`<podcast:transcript url="${transcriptUrl}"`);
}

/** 該 RSS 片段是否宣告任何 podcast:transcript（不限 URL）。 */
export function rssItemDeclaresPodcastTranscript(itemXml: string): boolean {
  return /<podcast:transcript[\s/>]/.test(itemXml);
}

export function associatedMediaHasVtt(
  associatedMedia: unknown,
  expectedContentUrl?: string,
): boolean {
  const list = Array.isArray(associatedMedia)
    ? associatedMedia
    : associatedMedia
      ? [associatedMedia]
      : [];
  return list.some((item) => {
    if (!item || typeof item !== "object") return false;
    const rec = item as Record<string, unknown>;
    if (rec.encodingFormat !== "text/vtt") return false;
    if (
      expectedContentUrl !== undefined &&
      rec.contentUrl !== expectedContentUrl
    ) {
      return false;
    }
    return true;
  });
}

/** 404 必須落在請求的 origin＋pathname，不可是跟隨 redirect 後的泛用 404 頁。 */
export function isDirectHttp404(
  requestedUrl: string,
  finalUrl: string,
  status: number,
): boolean {
  if (status !== 404) return false;
  try {
    const requested = new URL(requestedUrl);
    const final = new URL(finalUrl);
    return (
      requested.origin === final.origin &&
      requested.pathname === final.pathname
    );
  } catch {
    return false;
  }
}
