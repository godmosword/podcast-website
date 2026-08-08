/** AI 著色線稿 prompt 與人工審核清單（免 API，供腳本／契約測共用）。 */
import type { ColoringPageKind } from "@/data/coloring-pages";

const SHARED_LINE_RULES =
  "Clean black line art only. Thick, uniform black outlines; pure opaque white background; " +
  "no transparency, no shading, no clay texture, no gray tones, no color fills. " +
  "Every contour must be fully closed so each region can be flood-filled. " +
  "No text, letters, or numbers anywhere. " +
  "Keep characters exactly on-model with the reference image(s): same proportions, face, and distinctive features.";

/** 角色定裝頁：保大型道具，只刪紋理與微人群。 */
export const CHARACTER_LINE_ART_PROMPT =
  "Convert this character illustration into a children's coloring book page. " +
  SHARED_LINE_RULES +
  " Preserve the main subject AND the large landmark props from the reference " +
  "(for example grandstand, checkered flag, trophy, road curb, hills) as simple closed outlines. " +
  "You may remove micro-texture, tiny flowers, and individual crowd face detail, " +
  "but do NOT replace the setting with a bare sun-and-cloud outdoor stub.";

/**
 * 場景頁：圖 0（sourcePath）為構圖權威；額外定裝照只校正角色 on-model。
 * 禁止把室內／多車場景改成太陽雲單主體。
 */
export const SCENE_LINE_ART_PROMPT =
  "Convert illustration image 0 into a children's coloring book page. " +
  "Image 0 is the composition authority — match its layout, camera framing, and who appears where. " +
  "Any extra reference images are ONLY for character identity (on-model faces and body shapes), not for changing the scene. " +
  SHARED_LINE_RULES +
  " Keep every main vehicle/character that is clearly visible in image 0 (do not collapse a multi-vehicle scene into one car). " +
  "Keep 2–4 landmark environment silhouettes from image 0 (for example Ferris wheel, candy-shop counter and shelves, " +
  "water-park gate and slide, mud puddle with stuck scooter, grandstand). " +
  "Simplify micro-texture and tiny crowd faces only. " +
  "FORBIDDEN: inventing a different outdoor setting with only a sun, clouds, and a lone horizon line " +
  "when image 0 shows an indoor shop, amusement park race, playground, or water park.";

export function lineArtPromptFor(kind: ColoringPageKind): string {
  return kind === "scene" ? SCENE_LINE_ART_PROMPT : CHARACTER_LINE_ART_PROMPT;
}

/** 生成結束／approve 前人工審核清單（zh-TW）。 */
export const COLORING_LINEART_REVIEW_CHECKLIST: readonly string[] = [
  "主角數量與識別特徵是否與原彩圖一致（含第二主角）",
  "地標道具是否保留（摩天輪／櫃台／大門／泥坑等），而非只剩太陽雲地平線",
  "是否擅自改成無關戶外太陽雲場（場景頁嚴禁）",
  "角色臉／車身定裝是否 on-model（比例、眼睛、編號圈等）",
  "輪廓是否閉合、大區塊可塗（gate 已過仍須目視）",
] as const;

export function formatColoringReviewChecklist(): string {
  return [
    "人工審核清單（approve 前必過）：",
    ...COLORING_LINEART_REVIEW_CHECKLIST.map((item, i) => `  ${i + 1}. ${item}`),
  ].join("\n");
}
