import { currentBuildInfo } from "@/lib/build-info";

// build 時寫死：同一個部署永遠回同一份，網域換到別的部署就跟著換。
export const dynamic = "force-static";

export function GET(): Response {
  return Response.json(currentBuildInfo(), {
    headers: { "Cache-Control": "no-cache" },
  });
}
