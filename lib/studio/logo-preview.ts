import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getCharacterLogo } from "@/data/character-logos";
import { characterLogoAssetPath } from "@/lib/character-logo-query";
import type { LogoPreviewSize } from "@/lib/studio/logo-audit";
import { logoSourceSize } from "@/lib/studio/logo-audit";

export const LOGO_STAGING_DIR = "public/.logo-staging";
export const LOGO_PUBLIC_DIR = "public/characters/logo";

export type LogoPreviewKind = "approved" | "staging";

export type LogoPreviewItem = {
  slug: string;
  kind: LogoPreviewKind;
  file: string;
  src: string;
  diskPath: string;
};

const STAGING_FILE = /^\d{2}\.png$/;

export function isSafeStagingFile(file: string): boolean {
  return STAGING_FILE.test(file);
}

export function stagingAssetUrl(slug: string, file: string): string {
  return `/studio/logo-staging/${slug}/${file}`;
}

export function stagingDir(repoRoot: string, slug: string): string {
  return join(repoRoot, LOGO_STAGING_DIR, slug);
}

export function publicLogoPath(
  repoRoot: string,
  slug: string,
  size: 32 | 128 | 512,
): string {
  return join(repoRoot, LOGO_PUBLIC_DIR, `${slug}-${size}.webp`);
}

export function listLogoPreviews(
  repoRoot: string,
  slug: string,
): LogoPreviewItem[] {
  const dir = stagingDir(repoRoot, slug);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(isSafeStagingFile)
    .sort()
    .map((file) => ({
      slug,
      kind: "staging" as const,
      file,
      src: stagingAssetUrl(slug, file),
      diskPath: join(dir, file),
    }));
}

export function preferredLogoPreview(
  repoRoot: string,
  slug: string,
  preview: LogoPreviewSize,
): LogoPreviewItem | null {
  const size = logoSourceSize(preview);
  const approvedPath = publicLogoPath(repoRoot, slug, size);
  if (existsSync(approvedPath)) {
    return {
      slug,
      kind: "approved",
      file: `${slug}-${size}.webp`,
      src: characterLogoAssetPath(slug, size),
      diskPath: approvedPath,
    };
  }
  return listLogoPreviews(repoRoot, slug)[0] ?? null;
}

export function collectLogoPreviews(
  repoRoot: string,
  slugs: readonly string[],
  preview: LogoPreviewSize = 32,
): Record<string, LogoPreviewItem | null> {
  return Object.fromEntries(
    slugs.map((slug) => [slug, preferredLogoPreview(repoRoot, slug, preview)]),
  );
}

const SLUG_PATTERN = /^[a-z0-9-]+$/;

export function readLogoStagingAsset(
  repoRoot: string,
  slug: string,
  file: string,
): { body: Buffer; type: string } | null {
  if (!SLUG_PATTERN.test(slug) || !getCharacterLogo(slug)) return null;
  if (!isSafeStagingFile(file)) return null;
  const diskPath = join(stagingDir(repoRoot, slug), file);
  if (!existsSync(diskPath)) return null;
  return { body: readFileSync(diskPath), type: "image/png" };
}
