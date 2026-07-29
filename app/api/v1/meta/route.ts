import { apiV1Json, getChannelMetaApi } from "@/lib/api-v1";

// 本站紅線：全站靜態預渲染、零後端（見 next.config.ts 開頭）。
export const dynamic = "force-static";

/** GET /api/v1/meta — 頻道標題／RSS／平台連結。 */
export async function GET(): Promise<Response> {
  return apiV1Json(getChannelMetaApi());
}
