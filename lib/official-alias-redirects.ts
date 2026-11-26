import { OFFICIAL_SITE_ORIGIN } from "./site-edition";

/**
 * 官網專案固定的 vercel.app 網址 → 正式網域（永久）。
 *
 * 這個網址跟正式網域內容相同、Vercel 也不會替它加 noindex，搜尋引擎可能收錄成重複內容。
 * 只比對完整 host：單次部署與分支網址（Vercel 自己會加 noindex）、實驗站、本機都不轉，
 * 正式網域也不會轉到自己。
 */
const OFFICIAL_ALIAS_HOST = "podcast-website-official\\.vercel\\.app";

export function officialAliasRedirects(): {
  source: string;
  has: { type: "host"; value: string }[];
  destination: string;
  permanent: boolean;
}[] {
  return [
    {
      source: "/:path*",
      has: [{ type: "host", value: OFFICIAL_ALIAS_HOST }],
      destination: `${OFFICIAL_SITE_ORIGIN}/:path*`,
      permanent: true,
    },
  ];
}
