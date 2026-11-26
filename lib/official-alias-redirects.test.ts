import { describe, expect, it } from "vitest";
import nextConfig from "../next.config";
import { officialAliasRedirects } from "./official-alias-redirects";
import { OFFICIAL_SITE_ORIGIN } from "./site-edition";

const [rule] = officialAliasRedirects();
/** Next 比對 host 時會把 value 當成前後錨定的正規表示式。 */
const matchesHost = (host: string): boolean => new RegExp(`^${rule.has[0].value}$`).test(host);

describe("officialAliasRedirects", () => {
  it("官網專案的 vercel.app 網址整站永久轉到正式網域，路徑保留", () => {
    expect(officialAliasRedirects()).toHaveLength(1);
    expect(rule).toMatchObject({
      source: "/:path*",
      destination: `${OFFICIAL_SITE_ORIGIN}/:path*`,
      permanent: true,
    });
    expect(matchesHost("podcast-website-official.vercel.app")).toBe(true);
  });

  it.each([
    ["正式網域（轉到自己會無限迴圈）", "carcarplayground.com"],
    ["www", "www.carcarplayground.com"],
    ["實驗站", "podcast-website-mu.vercel.app"],
    ["官網專案的單次部署網址", "podcast-website-official-abc123xyz-team.vercel.app"],
    ["官網專案的分支網址", "podcast-website-official-git-release-team.vercel.app"],
    ["本機", "localhost"],
    ["點號被當成萬用字元的網址", "podcast-website-officialxvercel.app"],
  ])("不影響%s", (_label, host) => {
    expect(matchesHost(host)).toBe(false);
  });

  it("next.config 把它放第一條，其他轉址不會先在 vercel.app 上多跳一次", async () => {
    const redirects = await nextConfig.redirects?.();
    expect(redirects?.[0]).toEqual(rule);
  });
});
