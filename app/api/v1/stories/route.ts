import { apiV1Json, listStoriesApi } from "@/lib/api-v1";

/** GET /api/v1/stories — 集目列表（最新在前）。 */
export async function GET(): Promise<Response> {
  return apiV1Json({ stories: listStoriesApi() });
}
