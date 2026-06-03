/** Apple Podcasts 節目 ID（與 lib/platforms.ts 連結一致）。 */
export const APPLE_PODCAST_ID = "1896610920";

const LOOKUP_URL = `https://itunes.apple.com/lookup?id=${APPLE_PODCAST_ID}&entity=podcast`;

type LookupResult = {
  feedUrl?: string;
};

/** 透過 iTunes Lookup API 取得節目 RSS feed URL。 */
export async function lookupFeedUrl(): Promise<string> {
  const res = await fetch(LOOKUP_URL, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`iTunes lookup failed: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as { resultCount?: number; results?: LookupResult[] };
  const feedUrl = data.results?.[0]?.feedUrl;
  if (!feedUrl) {
    throw new Error("iTunes lookup: feedUrl not found");
  }
  return feedUrl;
}
