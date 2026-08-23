/**
 * 宇宙地圖資料的 Zod 契約。只給測試／CI 用，不得被 client bundle import。
 * 頁面 runtime 讀的是 `data/universe.ts` 的已信任常數。
 */
import { z } from "zod";
import {
  LANDING_SEGMENT_IDS,
  type LandingSegmentId,
} from "@/data/landing-segments";
import { ZONE_IDS, ZONE_STATUSES } from "./universe";

export const zoneStatusSchema = z.enum(ZONE_STATUSES);

export const hotspotSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  featured: z.boolean().default(false),
  pos: z.object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
  }),
  action: z.discriminatedUnion("type", [
    z.object({ type: z.literal("link"), href: z.string() }),
    z.object({ type: z.literal("story"), slug: z.string() }),
    z.object({ type: z.literal("locked"), hint: z.string() }),
  ]),
});

const softLinkSchema = z.object({
  label: z.string(),
  href: z.string(),
  external: z.boolean().optional(),
});

const landingSegmentIdSchema = z.enum(
  LANDING_SEGMENT_IDS as [LandingSegmentId, ...LandingSegmentId[]],
);

export const zoneSchema = z.object({
  id: z.enum(ZONE_IDS),
  name: z.string(),
  tagline: z.string(),
  status: zoneStatusSchema,
  world: z.object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
  }),
  camera: z.object({
    center: z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)]),
    zoom: z.number().positive(),
  }),
  sprite: z.string(),
  links: z.array(softLinkSchema).default([]),
  hotspots: z.array(hotspotSchema).default([]),
  landmark: z.string(),
  shortName: z.string().optional(),
  childHint: z.string().optional(),
  exploreNote: z.string().optional(),
  buildProgress: z.number().min(0).max(100).optional(),
  bridgeFrom: z.enum(ZONE_IDS).optional(),
  route: z
    .object({ href: z.string(), external: z.boolean().optional() })
    .optional(),
  subSegmentIds: z.array(landingSegmentIdSchema).optional(),
});

export const universeSchema = z.object({
  camera: z.object({
    worldZoom: z.number().positive(),
    minZoom: z.number().positive(),
    maxZoom: z.number().positive(),
  }),
  zones: z.array(zoneSchema).min(1),
});
