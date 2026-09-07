// Shared by the live scene and the offline Three poster renderer.
export const WORLD_LIGHT = {
  sky: "#fff1dc", ground: "#9dab9e", fill: 1.85,
  key: "#fff0d9", intensity: 2.45, position: [-3, 8, 5] as [number, number, number],
};
export const WORLD_CAMERA = {
  desktop: { position: [7, 10, 12] as [number, number, number], width: 13.8, height: 9.8, scale: 1.16 },
  // The wider mobile stage deliberately crops the island edges. A separate
  // scale keeps Little Red fully readable at 390px without shrinking desktop.
  mobile: { position: [5, 10.5, 14] as [number, number, number], width: 12.3, height: 9.8, scale: .94 },
  lookAt: [.18, .65, 0] as [number, number, number],
};
