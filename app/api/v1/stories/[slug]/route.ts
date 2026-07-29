import {
  apiV1Json,
  apiV1NotFound,
  getStoryApi,
} from "@/lib/api-v1";

/** GET /api/v1/stories/[slug] — 單集詳情（播放器欄位）。 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await params;
  const detail = getStoryApi(slug);
  if (!detail) return apiV1NotFound();
  return apiV1Json(detail);
}
