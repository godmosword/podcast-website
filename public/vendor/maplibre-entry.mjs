/**
 * 靜態載入 MapLibre，避開 Next 打包器無法處理的 worker URL。
 * 先指定同源 worker，再交給地圖圖層使用。
 */
import * as maplibregl from "./maplibre-gl.mjs";

maplibregl.setWorkerUrl(new URL("./maplibre-gl-worker.mjs", import.meta.url).href);
globalThis.maplibregl = maplibregl;
