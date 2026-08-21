import { readLogoStagingAsset } from "@/lib/studio/logo-preview";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; file: string }> },
) {
  const { slug, file } = await params;
  const asset = readLogoStagingAsset(process.cwd(), slug, file);
  if (!asset) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(new Uint8Array(asset.body), {
    status: 200,
    headers: {
      "Content-Type": asset.type,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
