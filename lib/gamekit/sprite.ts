export type SpriteFrameRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type SpriteAnimationDef = {
  name: string;
  frames: SpriteFrameRect[];
  fps: number;
  loop: boolean;
};

export type SpriteSheetSource =
  | { kind: "image"; image: CanvasImageSource }
  | { kind: "placeholder"; color: string };

/**
 * Sprite sheet 幀動畫（Phase 0 骨架；Phase 2 接 Aseprite 匯出）。
 */
export class SpriteAnimator {
  private animation: SpriteAnimationDef | null = null;
  private frameIndex = 0;
  private elapsed = 0;
  private finished = false;
  private flipX = false;

  constructor(
    private readonly source: SpriteSheetSource,
    private readonly anchorX = 0.5,
    private readonly anchorY = 1,
  ) {}

  play(animation: SpriteAnimationDef, restart = true): void {
    if (restart || this.animation?.name !== animation.name) {
      this.frameIndex = 0;
      this.elapsed = 0;
      this.finished = false;
    }
    this.animation = animation;
  }

  setFlipX(flip: boolean): void {
    this.flipX = flip;
  }

  update(dt: number): void {
    if (!this.animation || this.finished) return;
    const frameDuration = 1 / Math.max(1, this.animation.fps);
    this.elapsed += dt;
    while (this.elapsed >= frameDuration) {
      this.elapsed -= frameDuration;
      this.frameIndex += 1;
      if (this.frameIndex >= this.animation.frames.length) {
        if (this.animation.loop) {
          this.frameIndex = 0;
        } else {
          this.frameIndex = this.animation.frames.length - 1;
          this.finished = true;
        }
      }
    }
  }

  draw(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    scale = 1,
  ): void {
    if (!this.animation) return;
    const frame = this.animation.frames[this.frameIndex];
    if (!frame) return;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    const drawW = frame.w * scale;
    const drawH = frame.h * scale;
    const dx = x - drawW * this.anchorX;
    const dy = y - drawH * this.anchorY;

    if (this.source.kind === "placeholder") {
      ctx.fillStyle = this.source.color;
      ctx.fillRect(dx, dy, drawW, drawH);
      ctx.restore();
      return;
    }

    if (this.flipX) {
      ctx.translate(x, y);
      ctx.scale(-1, 1);
      ctx.drawImage(
        this.source.image,
        frame.x,
        frame.y,
        frame.w,
        frame.h,
        -drawW * this.anchorX,
        -drawH * this.anchorY,
        drawW,
        drawH,
      );
    } else {
      ctx.drawImage(
        this.source.image,
        frame.x,
        frame.y,
        frame.w,
        frame.h,
        dx,
        dy,
        drawW,
        drawH,
      );
    }

    ctx.restore();
  }

  get isFinished(): boolean {
    return this.finished;
  }
}
