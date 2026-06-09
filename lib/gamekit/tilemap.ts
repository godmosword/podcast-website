export type TileDef = {
  id: number;
  walkable: boolean;
  autotileGroup?: string;
};

export type TilemapData = {
  width: number;
  height: number;
  tileSize: number;
  layers: number[][][];
  tileset: TileDef[];
};

/**
 * Tilemap 載入與繪製 stub（Phase 5 接 Tiled JSON）。
 */
export class Tilemap {
  constructor(private readonly data: TilemapData) {}

  get width(): number {
    return this.data.width;
  }

  get height(): number {
    return this.data.height;
  }

  getTile(layer: number, tx: number, ty: number): number {
    const row = this.data.layers[layer]?.[ty];
    if (!row) return 0;
    return row[tx] ?? 0;
  }

  isWalkable(tx: number, ty: number, layer = 0): boolean {
    const id = this.getTile(layer, tx, ty);
    const def = this.data.tileset.find((t) => t.id === id);
    return def?.walkable ?? false;
  }

  /** Phase 2：接 sprite sheet blit；現以色塊佔位。 */
  drawPlaceholder(
    ctx: CanvasRenderingContext2D,
    originX: number,
    originY: number,
    colors: string[],
  ): void {
    const { tileSize, width, height, layers } = this.data;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    for (let li = 0; li < layers.length; li += 1) {
      for (let ty = 0; ty < height; ty += 1) {
        for (let tx = 0; tx < width; tx += 1) {
          const id = this.getTile(li, tx, ty);
          if (id === 0) continue;
          ctx.fillStyle = colors[id % colors.length] ?? "#888";
          ctx.fillRect(
            originX + tx * tileSize,
            originY + ty * tileSize,
            tileSize,
            tileSize,
          );
        }
      }
    }
    ctx.restore();
  }
}

export function emptyTilemap(w: number, h: number, tileSize = 16): Tilemap {
  const layers = [
    Array.from({ length: h }, () => Array.from({ length: w }, () => 0)),
  ];
  return new Tilemap({
    width: w,
    height: h,
    tileSize,
    layers,
    tileset: [{ id: 1, walkable: true }],
  });
}
