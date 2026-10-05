import { LINE_LUMA_WALL, lumaAt, regionMask } from "./tools";
/** Cache only eight recent regions, bounding the mask memory to eight bytes per image pixel. */
export class ColoringRegions {
  private masks: Uint8Array[] = [];
  constructor(
    private line: Uint8ClampedArray,
    readonly width: number,
    readonly height: number,
  ) {}
  resolve(x: number, y: number, radius = 12): Uint8Array | null {
    const sx = Math.floor(x),
      sy = Math.floor(y);
    if (sx < 0 || sy < 0 || sx >= this.width || sy >= this.height) return null;
    let seed: { x: number; y: number } | null = null;
    let distance = Infinity;
    const maxRadius = Math.min(24, Math.max(0, Math.ceil(radius)));
    for (let r = 0; r <= maxRadius && r * r <= distance; r++) {
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const px = sx + dx,
            py = sy + dy;
          if (px < 0 || py < 0 || px >= this.width || py >= this.height)
            continue;
          if (lumaAt(this.line, this.width, px, py) < LINE_LUMA_WALL) continue;
          const d = dx * dx + dy * dy;
          if (d <= maxRadius * maxRadius && d < distance) {
            distance = d;
            seed = { x: px, y: py };
          }
        }
    }
    if (!seed) return null;
    const at = seed.y * this.width + seed.x;
    const cached = this.masks.find((m) => m[at]);
    if (cached) return cached;
    const mask = regionMask(this.line, this.width, this.height, seed.x, seed.y);
    if (mask) {
      this.masks.unshift(mask);
      this.masks.length = Math.min(8, this.masks.length);
    }
    return mask;
  }
}
