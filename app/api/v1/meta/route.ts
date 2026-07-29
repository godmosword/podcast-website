import { apiV1Json, getChannelMetaApi } from "@/lib/api-v1";

/** GET /api/v1/meta — 頻道標題／RSS／平台連結。 */
export async function GET(): Promise<Response> {
  return apiV1Json(getChannelMetaApi());
}
