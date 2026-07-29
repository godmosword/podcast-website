import { getStories } from "@/data/content";
import {
  apiV1Json,
  apiV1NotFound,
  getStoryApi,
} from "@/lib/api-v1";

// 本站紅線：全站靜態預渲染、零後端（見 next.config.ts 開頭）。
// 已知 slug 於 build 時預產；未知 slug 仍走 on-demand 以維持 404 JSON 契約，
// 故 dynamicParams 保持預設 true。
export const dynamic = "force-static";

export function generateStaticParams(): { slug: string }[] {
  return getStories().map((story) => ({ slug: story.slug }));
}

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
