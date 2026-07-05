import { MAX_PIXEL_SCALE } from "./constants";
import { snapPixel } from "./palette";
import type { ViewportSize } from "../types";

type IntegerScaleResult = {
  scale: number;
  displayWidth: number;
  displayHeight: number;
  offsetX: number;
  offsetY: number;
};

/**
 * 計算最近鄰整數放大倍率，使 viewport 置中且 letterbox。
 * 純函式，可單元測試。
 */
function computeIntegerScale(
  viewport: ViewportSize,
  containerWidth: number,
  containerHeight: number,
  maxScale = MAX_PIXEL_SCALE,
): IntegerScaleResult {
  if (containerWidth <= 0 || containerHeight <= 0) {
    return {
      scale: 1,
      displayWidth: viewport.width,
      displayHeight: viewport.height,
      offsetX: 0,
      offsetY: 0,
    };
  }

  const scaleX = Math.floor(containerWidth / viewport.width);
  const scaleY = Math.floor(containerHeight / viewport.height);
  const scale = Math.max(1, Math.min(maxScale, scaleX, scaleY));

  const displayWidth = viewport.width * scale;
  const displayHeight = viewport.height * scale;
  const offsetX = snapPixel((containerWidth - displayWidth) / 2);
  const offsetY = snapPixel((containerHeight - displayHeight) / 2);

  return { scale, displayWidth, displayHeight, offsetX, offsetY };
}

export type PixelRendererOptions = {
  viewport: ViewportSize;
  background?: string;
  maxScale?: number;
  imageSmoothing?: boolean;
};

/**
 * 低解析度 offscreen buffer → 整數倍放大至 display canvas。
 */
export class PixelRenderer {
  readonly viewport: ViewportSize;
  private readonly buffer: HTMLCanvasElement;
  private readonly bufferCtx: CanvasRenderingContext2D;
  private display: HTMLCanvasElement | null = null;
  private displayCtx: CanvasRenderingContext2D | null = null;
  private background: string;
  private maxScale: number;
  private imageSmoothing: boolean;
  private scale = 1;

  constructor(options: PixelRendererOptions) {
    this.viewport = options.viewport;
    this.background = options.background ?? "#1a1a2e";
    this.maxScale = options.maxScale ?? MAX_PIXEL_SCALE;
    this.imageSmoothing = options.imageSmoothing ?? false;

    this.buffer = document.createElement("canvas");
    this.buffer.width = options.viewport.width;
    this.buffer.height = options.viewport.height;

    const ctx = this.buffer.getContext("2d");
    if (!ctx) throw new Error("PixelRenderer: 2d context unavailable");
    this.bufferCtx = ctx;
    this.applyBufferContextDefaults();
  }

  /** 綁定實際顯示用 canvas（由 React ref 提供）。 */
  attachDisplay(canvas: HTMLCanvasElement): void {
    this.display = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("PixelRenderer: display 2d context unavailable");
    this.displayCtx = ctx;
    this.applyDisplayContextDefaults();
  }

  get context(): CanvasRenderingContext2D {
    return this.bufferCtx;
  }

  get currentScale(): number {
    return this.scale;
  }

  resize(containerWidth: number, containerHeight: number): IntegerScaleResult {
    const layout = computeIntegerScale(
      this.viewport,
      containerWidth,
      containerHeight,
      this.maxScale,
    );
    this.scale = layout.scale;

    if (this.display && this.displayCtx) {
      this.display.width = containerWidth;
      this.display.height = containerHeight;
      this.applyDisplayContextDefaults();
    }

    return layout;
  }

  clear(color?: string): void {
    this.bufferCtx.fillStyle = color ?? this.background;
    this.bufferCtx.fillRect(0, 0, this.viewport.width, this.viewport.height);
  }

  /** 將 buffer 以 nearest-neighbor 放大繪製至 display。 */
  blit(layout?: IntegerScaleResult): void {
    if (!this.display || !this.displayCtx) return;

    const {
      displayWidth,
      displayHeight,
      offsetX,
      offsetY,
    } =
      layout ??
      computeIntegerScale(
        this.viewport,
        this.display.width,
        this.display.height,
        this.maxScale,
      );

    this.displayCtx.fillStyle = this.background;
    this.displayCtx.fillRect(0, 0, this.display.width, this.display.height);

    this.displayCtx.imageSmoothingEnabled = this.imageSmoothing;
    this.displayCtx.drawImage(
      this.buffer,
      0,
      0,
      this.viewport.width,
      this.viewport.height,
      offsetX,
      offsetY,
      displayWidth,
      displayHeight,
    );
  }

  private applyBufferContextDefaults(): void {
    this.bufferCtx.imageSmoothingEnabled = false;
  }

  private applyDisplayContextDefaults(): void {
    if (!this.displayCtx) return;
    this.displayCtx.imageSmoothingEnabled = this.imageSmoothing;
  }
}
