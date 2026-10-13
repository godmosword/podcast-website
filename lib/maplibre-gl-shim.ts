/**
 * 建置期替身。真正的 MapLibre 由 /vendor/maplibre-entry.mjs 放上 globalThis，
 * 這樣打包器不必解析官方套件裡的動態 worker 網址。
 */

type MapLibreMap = object;

type MapLibreNamespace = {
  Map: new (options: Record<string, unknown>) => MapLibreMap;
};

function namespace(): MapLibreNamespace {
  const loaded = (globalThis as { maplibregl?: MapLibreNamespace }).maplibregl;
  if (!loaded) throw new Error("MapLibre 尚未載入");
  return loaded;
}

export class Map {
  constructor(options: Record<string, unknown>) {
    return new (namespace().Map)(options);
  }
}
