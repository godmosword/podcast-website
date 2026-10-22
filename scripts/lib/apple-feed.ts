/**
 * iTunes lookup 與 RSS 下載。兩者都走 withRetry，給 sync 與看門狗共用。
 */
import { lookupFeedUrl } from "../../lib/podcast-apple";
import { isOversizedDownloadError, withRetry } from "./retry";

const RSS_TIMEOUT_MS = 60_000;

export async function lookupFeedUrlWithRetry(): Promise<string> {
  return withRetry(() => lookupFeedUrl(), { label: "iTunes lookup" });
}

export async function fetchRssXml(feedUrl: string): Promise<string> {
  return withRetry(
    async () => {
      const res = await fetch(feedUrl, {
        redirect: "follow",
        signal: AbortSignal.timeout(RSS_TIMEOUT_MS),
      });
      if (!res.ok) {
        throw new Error(`RSS fetch failed: ${res.status}`);
      }
      return res.text();
    },
    { label: "RSS fetch" },
  );
}

export async function downloadBytes(
  url: string,
  timeoutMs: number,
  maxBytes: number,
  label: string,
): Promise<Buffer> {
  return withRetry(
    async () => {
      const res = await fetch(url, {
        redirect: "follow",
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) {
        throw new Error(`Download failed ${res.status}: ${url}`);
      }
      const len = res.headers.get("content-length");
      if (len && Number.parseInt(len, 10) > maxBytes) {
        throw new Error(`File too large (${len} bytes): ${url}`);
      }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > maxBytes) {
        throw new Error(`File too large (${buf.length} bytes): ${url}`);
      }
      return buf;
    },
    {
      label,
      shouldRetry: (error) => !isOversizedDownloadError(error),
    },
  );
}
