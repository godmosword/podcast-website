import { SpriteAnimator } from "./sprite";
import { getGameSheet, type SheetId } from "./procedural-sheets";
import type { SpriteAnimationDef } from "./sprite";

export type SpriteHandle = {
  animator: SpriteAnimator;
  play: (anim: SpriteAnimationDef, restart?: boolean) => void;
  update: (dt: number) => void;
  draw: (ctx: CanvasRenderingContext2D, x: number, y: number, scale?: number) => void;
};

/** 建立綁定程序生成 sheet 的 SpriteAnimator。 */
export function createKitSprite(
  sheetId: SheetId,
  defaultAnim: SpriteAnimationDef,
  anchorX = 0.5,
  anchorY = 1,
): SpriteHandle {
  const sheet = getGameSheet(sheetId);
  const animator = new SpriteAnimator(
    { kind: "image", image: sheet },
    anchorX,
    anchorY,
  );
  animator.play(defaultAnim);

  return {
    animator,
    play: (anim, restart) => animator.play(anim, restart),
    update: (dt) => animator.update(dt),
    draw: (ctx, x, y, scale) => animator.draw(ctx, x, y, scale),
  };
}

/** 在 canvas 上 blit tile（內部 16×16）。 */
export function drawKitTile(
  ctx: CanvasRenderingContext2D,
  sheetId: SheetId,
  tileCol: number,
  dx: number,
  dy: number,
  scale = 1,
): void {
  const sheet = getGameSheet(sheetId);
  const size = 16 * scale;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sheet, tileCol * 16, 0, 16, 16, dx, dy, size, size);
  ctx.restore();
}
