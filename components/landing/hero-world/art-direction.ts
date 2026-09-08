// Shared by the live scene and the offline Three poster renderer.
export const WORLD_LIGHT = {
  sky: "#fff1dc", ground: "#9dab9e", fill: 1.85,
  key: "#fff0d9", intensity: 2.45, position: [-3, 8, 5] as [number, number, number],
};
export const WORLD_CAMERA = {
  // Phase 8 framing: the base is meant to run off the stage at both ends, so the
  // world reads as a place that continues past the frame instead of a product
  // shot floating in cream. Roof, ferris rim and Little Red's eyes stay inside.
  desktop: { position: [7, 10, 12] as [number, number, number], width: 13.8, height: 9.8, scale: 1.2 },
  // The wider mobile stage deliberately crops the island edges. A separate
  // scale keeps Little Red fully readable at 390px without shrinking desktop.
  mobile: { position: [5, 10.5, 14] as [number, number, number], width: 12.3, height: 9.8, scale: 1.15 },
  lookAt: [.18, .65, 0] as [number, number, number],
};
