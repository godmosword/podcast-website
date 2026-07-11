import type { PlatformClickSource } from "@/lib/analytics";

/** Growth-Measure-1b：官網外連至收聽平台的 UTM medium 規格。 */
export type PlatformUtmMedium =
  | "story_page"
  | "footer"
  | "subscribe_cta"
  | "social";

const SOURCE_TO_MEDIUM: Record<PlatformClickSource, PlatformUtmMedium> = {
  "subscription-cta": "subscribe_cta",
  "story-cta": "story_page",
  "story-platforms": "story_page",
  "footer-connect": "footer",
  "home-subscribe": "subscribe_cta",
  "nav-bar": "subscribe_cta",
  "nav-dropdown": "subscribe_cta",
  "nav-menu": "subscribe_cta",
};

export function platformUtmMedium(source: PlatformClickSource): PlatformUtmMedium {
  return SOURCE_TO_MEDIUM[source];
}

/** 為平台外連加上 utm_source／utm_medium／utm_campaign（已有參數則覆寫）。 */
export function appendPlatformUtm(
  url: string,
  opts: { source: PlatformClickSource; campaign?: string },
): string {
  const base = url.trim();
  if (!base) return base;

  try {
    const parsed = new URL(base);
    parsed.searchParams.set("utm_source", "cheche_web");
    parsed.searchParams.set("utm_medium", platformUtmMedium(opts.source));
    parsed.searchParams.set("utm_campaign", opts.campaign?.trim() || "site");
    return parsed.toString();
  } catch {
    return base;
  }
}
