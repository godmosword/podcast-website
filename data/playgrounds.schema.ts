/**
 * Playground 資料的 Zod 契約。只給測試／CI 用，不得被 client bundle import。
 * 頁面 runtime 讀的是 `data/playgrounds.ts` 的已信任常數。
 */
import { z } from "zod";
import { PLAYGROUND_TYPES } from "./playgrounds";

export const playgroundSourceSchema = z.object({
  kind: z.enum(["official", "gov", "editorial"]),
  name: z.string().min(1),
  url: z.string().min(1),
});

/** 僅測試用 safeParse；頁面 runtime 不因 schema 丟例外。 */
export const playgroundSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  city: z.string().min(1),
  district: z.string().min(1).optional(),
  region: z.string().min(1).optional(),
  lat: z.number(),
  lng: z.number(),
  address: z.string().min(1),
  type: z.enum(PLAYGROUND_TYPES),
  ageRange: z.tuple([z.number(), z.number()]),
  free: z.boolean(),
  feeNote: z.string().min(1).optional(),
  indoor: z.boolean(),
  facilities: z.array(z.string()),
  tags: z.array(z.string()),
  tips: z.string().min(1),
  officialUrl: z.string().min(1).optional(),
  relatedEpisodes: z.array(z.string()).optional(),
  sources: z.array(playgroundSourceSchema).min(1),
  lastVerified: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  coverageNote: z.string().min(1).optional(),
  status: z.literal("temporarily-closed").optional(),
  placeId: z.string().min(1).optional(),
  mapsQuery: z.string().min(1).optional(),
});
