import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const LCP_WEBP_QUALITY = 82;
const LCP_AVIF_QUALITY = 50;
/** 播放頁角色插圖：比 landing hero 略高，避免臉部糊掉。 */
const STORY_COVER_WEBP_QUALITY = 84;
const STORY_COVER_AVIF_QUALITY = 62;

const STORY_COVER_JPG_RE = /\/stories\/[^/]+\/01\.jpe?g$/i;

function jpgSiblingPaths(jpgPath: string): { webp: string; avif: string } {
  const base = jpgPath.replace(/\.jpe?g$/i, "");
  return { webp: `${base}.webp`, avif: `${base}.avif` };
}

function qualityFor(jpgPath: string): { webp: number; avif: number } {
  if (STORY_COVER_JPG_RE.test(jpgPath.replace(/\\/g, "/"))) {
    return { webp: STORY_COVER_WEBP_QUALITY, avif: STORY_COVER_AVIF_QUALITY };
  }
  return { webp: LCP_WEBP_QUALITY, avif: LCP_AVIF_QUALITY };
}

export async function writeModernSiblings(jpgPath: string): Promise<void> {
  const input = readFileSync(jpgPath);
  const meta = await sharp(input).metadata();
  const { webp, avif } = jpgSiblingPaths(jpgPath);
  const quality = qualityFor(jpgPath);

  const webpBuf = await sharp(input)
    .webp({ quality: quality.webp, effort: 4 })
    .toBuffer();
  writeFileSync(webp, webpBuf);

  const avifBuf = await sharp(input)
    .avif({ quality: quality.avif, effort: 4 })
    .toBuffer();
  writeFileSync(avif, avifBuf);

  const jpgKb = Math.round(input.length / 1024);
  const webpKb = Math.round(webpBuf.length / 1024);
  const avifKb = Math.round(avifBuf.length / 1024);
  console.log(
    `✓ ${jpgPath.replace(/^.*\/public\//, "public/")} ${meta.width}×${meta.height} JPG ${jpgKb}KB → WebP ${webpKb}KB / AVIF ${avifKb}KB`,
  );
}

export function listLcpJpgTargets(publicDir: string): string[] {
  const landingDir = join(publicDir, "landing");
  const landing = existsSync(landingDir)
    ? readdirSync(landingDir)
        .filter((name) => /^segment-.*\.jpe?g$/i.test(name))
        .map((name) => join(landingDir, name))
    : [];

  const hero = join(publicDir, "hero-home.jpg");
  const storiesDir = join(publicDir, "stories");
  const covers = existsSync(storiesDir)
    ? readdirSync(storiesDir)
        .map((slug) => join(storiesDir, slug, "01.jpg"))
        .filter((file) => existsSync(file))
    : [];
  return [...landing, ...(existsSync(hero) ? [hero] : []), ...covers].sort();
}

export async function verifyModernSiblings(jpgPath: string): Promise<boolean> {
  const { webp, avif } = jpgSiblingPaths(jpgPath);
  if (!existsSync(webp) || !existsSync(avif)) return false;
  const jpgMeta = await sharp(jpgPath).metadata();
  const webpMeta = await sharp(webp).metadata();
  const avifMeta = await sharp(avif).metadata();
  return (
    jpgMeta.width === webpMeta.width &&
    jpgMeta.width === avifMeta.width &&
    jpgMeta.height === webpMeta.height &&
    jpgMeta.height === avifMeta.height
  );
}
