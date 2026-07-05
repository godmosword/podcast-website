/** Godot Web export 靜態資產（對齊 public/candy-kart/index.html GODOT_CONFIG.fileSizes）。 */
export const CANDY_KART_GODOT_ASSETS = [
  { path: "/candy-kart/index.js", bytes: 331_776 },
  { path: "/candy-kart/index.wasm", bytes: 35_376_909 },
  { path: "/candy-kart/index.pck", bytes: 134_624 },
  { path: "/candy-kart/index.audio.worklet.js", bytes: 7_270 },
] as const;

export const CANDY_KART_TOTAL_BYTES = CANDY_KART_GODOT_ASSETS.reduce(
  (sum, asset) => sum + asset.bytes,
  0,
);
