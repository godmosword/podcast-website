import type { AdventureLevelJson } from "./adventure-level";

/** Tiled 1.x JSON 匯出（精簡型別，足夠 Phase 5 loader）。 */
export type TiledObject = {
  id?: number;
  name?: string;
  type?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  visible?: boolean;
  properties?: { name: string; value: string | number | boolean }[];
};

export type TiledTileLayer = {
  type: "tilelayer";
  name: string;
  width: number;
  height: number;
  data: number[];
  visible?: boolean;
};

export type TiledObjectGroup = {
  type: "objectgroup";
  name: string;
  objects: TiledObject[];
  visible?: boolean;
};

export type TiledLayer = TiledTileLayer | TiledObjectGroup;

export type TiledMapJson = {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  layers: TiledLayer[];
  properties?: { name: string; value: string | number }[];
};

export type TiledToAdventureOptions = {
  id?: string;
  name?: string;
  solidLayer?: string;
  spikeLayer?: string;
  objectLayer?: string;
};

function tileLayerToCells(layer: TiledTileLayer): string[] {
  const cells: string[] = [];
  for (let i = 0; i < layer.data.length; i += 1) {
    if (layer.data[i] === 0) continue;
    const tx = i % layer.width;
    const ty = Math.floor(i / layer.width);
    cells.push(`${tx},${ty}`);
  }
  return cells;
}

function objectTile(
  obj: TiledObject,
  tileW: number,
  tileH: number,
): [number, number] {
  const tx = Math.floor(obj.x / tileW);
  const ty = Math.floor(obj.y / tileH);
  return [tx, ty];
}

/**
 * 將 Tiled JSON 轉為 Game Kit 大冒險關卡格式。
 *
 * 約定：
 * - tilelayer `solid` / `spikes`：非 0 格為實心／尖刺
 * - objectgroup `objects`：`type` 為 player | finish | coin | enemy
 */
export function tiledToAdventureJson(
  map: TiledMapJson,
  options: TiledToAdventureOptions = {},
): AdventureLevelJson {
  const solidLayer = options.solidLayer ?? "solid";
  const spikeLayer = options.spikeLayer ?? "spikes";
  const objectLayer = options.objectLayer ?? "objects";

  const solid: string[] = [];
  const spikes: string[] = [];
  const coins: [number, number][] = [];
  const enemies: { x: number; y: number; vx?: number }[] = [];
  const breakable: string[] = [];
  const abilityGates: { x: number; y: number; ability: string }[] = [];
  const secrets: string[] = [];
  let start: [number, number] | null = null;
  let finish: [number, number, number?, number?] | null = null;

  const tileW = map.tilewidth;
  const tileH = map.tileheight;

  for (const layer of map.layers) {
    if (layer.visible === false) continue;
    if (layer.type === "tilelayer") {
      if (layer.name === solidLayer) solid.push(...tileLayerToCells(layer));
      if (layer.name === spikeLayer) spikes.push(...tileLayerToCells(layer));
    }
    if (layer.type === "objectgroup" && layer.name === objectLayer) {
      for (const obj of layer.objects) {
        if (obj.visible === false) continue;
        const kind = (obj.type || obj.name || "").toLowerCase();
        const [tx, ty] = objectTile(obj, tileW, tileH);
        if (kind === "player" || kind === "start") {
          start = [tx, ty];
        } else if (kind === "finish" || kind === "goal") {
          const fw = obj.width ? Math.max(1, Math.round(obj.width / tileW)) : 1;
          const fh = obj.height ? Math.max(1, Math.round(obj.height / tileH)) : 2;
          finish = [tx, ty, fw, fh];
        } else if (kind === "coin") {
          coins.push([tx, ty]);
        } else if (kind === "enemy") {
          enemies.push({ x: tx, y: ty });
        } else if (kind === "breakable") {
          breakable.push(`${tx},${ty}`);
        } else if (kind === "ability-gate" || kind === "ability_gate") {
          const ability =
            obj.properties?.find((p) => p.name === "ability")?.value?.toString() ??
            obj.name ??
            "breakable";
          abilityGates.push({ x: tx, y: ty, ability });
        } else if (kind === "secret") {
          secrets.push(`${tx},${ty}`);
        }
      }
    }
  }

  const mapName =
    options.name ??
    map.properties?.find((p) => p.name === "name")?.value?.toString() ??
    "未命名關卡";

  if (!start) start = [1, map.height - 2];
  if (!finish) finish = [map.width - 2, map.height - 3, 1, 2];

  return {
    id: options.id ?? "tiled-import",
    name: mapName,
    tileSize: tileW,
    cols: map.width,
    rows: map.height,
    solid,
    spikes,
    coins,
    enemies,
    start,
    finish,
    ...(breakable.length > 0 ? { breakable } : {}),
    ...(abilityGates.length > 0 ? { abilityGates } : {}),
    ...(secrets.length > 0 ? { secrets } : {}),
  };
}

export function isTiledMapJson(value: unknown): value is TiledMapJson {
  if (!value || typeof value !== "object") return false;
  const m = value as TiledMapJson;
  return (
    typeof m.width === "number" &&
    typeof m.height === "number" &&
    typeof m.tilewidth === "number" &&
    Array.isArray(m.layers)
  );
}

/** 接受 Tiled 或 Game Kit JSON，統一回傳 AdventureLevelJson。 */
export function normalizeAdventureLevelJson(
  raw: unknown,
  options?: TiledToAdventureOptions,
): AdventureLevelJson {
  if (isTiledMapJson(raw)) return tiledToAdventureJson(raw, options);
  const j = raw as AdventureLevelJson;
  if (!j.id || !j.cols || !Array.isArray(j.solid)) {
    throw new Error("無法辨識的關卡 JSON 格式");
  }
  return j;
}
