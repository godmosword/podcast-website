/**
 * GEO live 煙霧：最新集逐字稿預期。
 * 與 RSS／JSON-LD 契約對齊——只有 hasFullTranscript 才宣告 VTT。
 * MVP 無字幕側車時，不得要求 live `/transcript.vtt` 200。
 */

export type TranscriptLiveMode = "require" | "forbid";

export function transcriptLiveMode(hasSidecar: boolean): TranscriptLiveMode {
  return hasSidecar ? "require" : "forbid";
}

export function rssHasPodcastTranscript(
  feedXml: string,
  transcriptUrl: string,
): boolean {
  return feedXml.includes(`<podcast:transcript url="${transcriptUrl}"`);
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
