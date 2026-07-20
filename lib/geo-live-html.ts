/**
 * 部署後 GEO smoke 用的純 HTML 解析（無 Node fetch 依賴）。
 */

/** 常見 Vercel／WAF 阻擋或部署不存在頁（HTTP 200 時仍可能誤判，採保守關鍵字）。 */
const ERROR_PAGE_MARKERS = [
  "DEPLOYMENT_NOT_FOUND",
  "The deployment could not be found",
  "Vercel Security Checkpoint",
  "Access to this site has been blocked",
  "Request blocked",
  "Attention Required! | Cloudflare",
] as const;

export function isLikelyEdgeOrWafErrorPage(body: string, contentType: string | null): boolean {
  if (contentType && /text\/html/i.test(contentType)) {
    for (const marker of ERROR_PAGE_MARKERS) {
      if (body.includes(marker)) return true;
    }
  }
  return false;
}

export function parseJsonLdBlocks(html: string): unknown[] {
  const re = /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  const parsed: unknown[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    parsed.push(JSON.parse(m[1]!));
  }
  return parsed;
}

export function flattenJsonLdNodes(parsed: unknown): Record<string, unknown>[] {
  if (parsed && typeof parsed === "object" && "@graph" in (parsed as Record<string, unknown>)) {
    const graph = (parsed as { "@graph": unknown })["@graph"];
    if (Array.isArray(graph)) return graph as Record<string, unknown>[];
  }
  return [parsed as Record<string, unknown>];
}

/** 從 HTML 取出 rel=canonical 的 href（第一個）。 */
export function extractCanonicalHref(html: string): string | null {
  const re =
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i;
  const m = re.exec(html);
  if (m?.[1]) return m[1];
  const re2 =
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["'][^>]*>/i;
  return re2.exec(html)?.[1] ?? null;
}

export function contentTypeMatches(expected: RegExp, contentType: string | null): boolean {
  if (!contentType) return false;
  const base = contentType.split(";")[0]?.trim() ?? "";
  return expected.test(base);
}
