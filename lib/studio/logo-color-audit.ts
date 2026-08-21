import { readFileSync } from "node:fs";
import {
  familyBackgroundHex,
  type CharacterLogo,
} from "@/data/character-logos";
import {
  compareSampledPrimary,
  samplePrimaryHex,
} from "@/lib/studio/logo-sample";
import type { LogoPreviewItem } from "@/lib/studio/logo-preview";

export type LogoColorSampleRow = {
  slug: string;
  name: string;
  source: "approved" | "staging";
  file: string;
  intended: string;
  sampled: string | null;
  hueDist: number | null;
  silhouette: number | null;
  gate: number | null;
};

export async function samplePreviewRow(
  logo: CharacterLogo,
  item: LogoPreviewItem,
): Promise<LogoColorSampleRow> {
  const familyBg = familyBackgroundHex(logo.family);
  let sampled: string | null = null;
  try {
    sampled = await samplePrimaryHex(readFileSync(item.diskPath), familyBg);
  } catch {
    sampled = null;
  }
  const compared = sampled
    ? compareSampledPrimary(sampled, logo.ipColorPrimary, familyBg)
    : null;
  return {
    slug: logo.slug,
    name: logo.name,
    source: item.kind,
    file: item.file,
    intended: logo.ipColorPrimary,
    sampled,
    hueDist: compared?.hueDist ?? null,
    silhouette: compared?.silhouette ?? null,
    gate: compared?.gate ?? null,
  };
}
