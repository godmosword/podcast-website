/**
 * 阿蹦雪山視覺 QA 契約（站內／Godot 共用常數）。
 * 對齊 `snowboard-game/scripts/materials.gd` CATALOG 與 patch-snowboard-html 參數。
 */

export const SNOWBOARD_VISUAL_STAGES = [
  "start",
  "forest",
  "valley",
  "finish",
] as const;

export type SnowboardVisualStage = (typeof SNOWBOARD_VISUAL_STAGES)[number];

export const SNOWBOARD_VISUAL_POSES = [
  "ride",
  "carve",
  "jump",
  "landing",
] as const;

export type SnowboardVisualPose = (typeof SNOWBOARD_VISUAL_POSES)[number];

/** 必須與 SnowMaterials.CATALOG 字串一致（source 契約測試會對帳）。 */
export const SNOWBOARD_MATERIAL_CATALOG = [
  "clay",
  "snow",
  "grooming",
  "blob_shadow",
  "translucent",
  "backdrop",
  "skin",
  "fabric",
  "wood",
  "foliage",
  "board_plastic",
  "ice",
] as const;

export type SnowboardMaterialId = (typeof SNOWBOARD_MATERIAL_CATALOG)[number];

export function isSnowboardVisualStage(
  value: string | null | undefined,
): value is SnowboardVisualStage {
  return (
    typeof value === "string" &&
    SNOWBOARD_VISUAL_STAGES.some((stage) => stage === value)
  );
}

export function isSnowboardVisualPose(
  value: string | null | undefined,
): value is SnowboardVisualPose {
  return (
    typeof value === "string" &&
    SNOWBOARD_VISUAL_POSES.some((pose) => pose === value)
  );
}
