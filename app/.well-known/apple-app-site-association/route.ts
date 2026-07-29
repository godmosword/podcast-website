import { buildAppleAppSiteAssociation } from "@/lib/ios-app-links";

export const dynamic = "force-static";

/** Apple Universal Links：`/.well-known/apple-app-site-association` */
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
