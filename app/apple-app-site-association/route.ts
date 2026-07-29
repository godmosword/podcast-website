import { buildAppleAppSiteAssociation } from "@/lib/ios-app-links";

export const dynamic = "force-static";

/** Apple 亦可能請求根路徑 `/apple-app-site-association`（無副檔名）。 */
export function GET(): Response {
  const body = buildAppleAppSiteAssociation();
  return Response.json(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
