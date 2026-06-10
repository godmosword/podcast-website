import { z } from "zod";
import ep8 from "@/data/hotspots/ep-8.json";
import ep9 from "@/data/hotspots/ep-9.json";

const sfxKindSchema = z.enum(["tap", "flip", "collect"]);

const hotspotSchema = z.object({
  id: z.string().min(1),
  page: z.number().int().min(1),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  w: z.number().min(0.05).max(1),
  h: z.number().min(0.05).max(1),
  label: z.string().min(1),
  tip: z.string().min(1),
  sfx: sfxKindSchema.optional(),
});

const hotspotFileSchema = z.object({
  slug: z.string().min(1),
  hotspots: z.array(hotspotSchema),
});

export type Hotspot = z.infer<typeof hotspotSchema>;
export type HotspotFile = z.infer<typeof hotspotFileSchema>;

const REGISTRY: Record<string, HotspotFile> = {
  "ep-8": parseHotspotFile(ep8),
  "ep-9": parseHotspotFile(ep9),
};

function parseHotspotFile(raw: unknown): HotspotFile {
  return hotspotFileSchema.parse(raw);
}

export function getHotspotsForStory(slug: string): Hotspot[] {
  return REGISTRY[slug]?.hotspots ?? [];
}

export function getHotspotsForPage(slug: string, page: number): Hotspot[] {
  const pageIndex = page + 1;
  return getHotspotsForStory(slug).filter((h) => h.page === pageIndex);
}

export function listHotspotSlugs(): string[] {
  return Object.keys(REGISTRY);
}
