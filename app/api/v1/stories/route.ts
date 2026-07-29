import { apiV1Json, listStoriesApi } from "@/lib/api-v1";

// 本站紅線：全站靜態預渲染、零後端（見 next.config.ts 開頭）。
export const dynamic = "force-static";

/** GET /api/v1/stories — 集目列表（最新在前）。 */
export async function GET(): Promise<Response> {
  return apiV1Json({ stories: listStoriesApi() });
}
