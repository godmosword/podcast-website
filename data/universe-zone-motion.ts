/**
 * 各島可動零件（motionParts）— 對齊 docs/UNIVERSE-ART-BIBLE.md §12。
 *
 * ⚠ §12.1 鐵律：base PNG 不可包含可動部位。現有 car-park.png 極可能已烘焙
 * 摩天輪/旗/小紅車；未來補零件 PNG 時 base 必須一併重出，否則零件層疊影。
 *
 * enabled 預設 false：資產未齊時 production 不渲染。dev 用 ?devMotion=1 驗證。
 */
import type { ZoneId } from "@/data/universe-zones";
import { CAR_PARK_WALKWAY_PATH } from "@/data/universe-roamers";

type MotionPartBase = {
  name: string;
  src: string;
  srcNight?: string;
  /** 資產就緒後改 true；預設 false 避免 placeholder 污染 production */
  enabled?: boolean;
  periodMs?: number;
  delayMs?: number;
};

export type MotionPart =
  | (MotionPartBase & {
      motion: "spin";
      pivot: { x: number; y: number };
      periodMs: number;
    })
  | (MotionPartBase & {
      motion: "sway";
      amplitudeDeg: number;
      periodMs: number;
      pivot?: { x: number; y: number };
    })
  | (MotionPartBase & {
      motion: "sweep";
      pivot: { x: number; y: number };
      amplitudeDeg: number;
      periodMs: number;
    })
  | (MotionPartBase & {
      motion: "bob";
      amplitudePx: number;
      periodMs: number;
    })
  | (MotionPartBase & {
      motion: "path";
      path: string;
      periodMs: number;
    })
  | (MotionPartBase & {
      motion: "sprite";
      sprite: { frames: number; fps: number };
    });

/** car-park 步道 path（tile 本地座標 264×260，產零件時一併量出） */
const CAR_PARK_MASCOT_PATH = CAR_PARK_WALKWAY_PATH;

export type MotionType = "spin" | "sway" | "bob" | "sweep" | "path" | "sprite";

export const ZONE_MOTION: Partial<Record<ZoneId, MotionPart[]>> = {
  "car-park": [
    {
      name: "wheel",
      src: "/adventures/zones/car-park.wheel.png",
      motion: "spin",
      pivot: { x: 0.5, y: 0.46 },
      periodMs: 11000,
      enabled: false,
    },
    {
      name: "flags",
      src: "/adventures/zones/car-park.flags.png",
      motion: "sway",
      amplitudeDeg: 4,
      periodMs: 3600,
      pivot: { x: 0.5, y: 0.85 },
      enabled: false,
    },
    {
      name: "mascot-car",
      src: "/adventures/zones/car-park.mascot-car.png",
      motion: "path",
      periodMs: 16000,
      path: CAR_PARK_MASCOT_PATH,
      enabled: false,
    },
  ],
};

/** 零件是否應渲染（production 僅 enabled；dev 可用 devMotion 開佔位） */
export function shouldRenderMotionPart(
  part: MotionPart,
  devMotion: boolean,
): boolean {
  if (part.enabled) return true;
  if (devMotion && process.env.NODE_ENV !== "production") return true;
  return false;
}

/** dev 用 ?devMotion=1（僅非 production） */
export function isDevMotionQuery(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("devMotion") === "1";
}
