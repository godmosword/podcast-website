// Shared by the live scene and the offline Three poster renderer.
export const WORLD_LIGHT = {
  sky: "#fff1dc", ground: "#9dab9e", fill: 1.85,
  key: "#fff0d9", intensity: 2.45, position: [-3, 8, 5] as [number, number, number],
  /** 程序式環境漸層的中段色；只有 WorldEnvironment 讀它。 */
  horizon: "#f6e4cd",
  /** scene.environmentIntensity。太高會把黏土洗成塑膠。 */
  envIntensity: .38,
  /** 逆光輪廓光：把主體從奶油底色裡拉出來，不投影、不吃 shadow map。 */
  rim: { color: "#cfe3d2", intensity: .55, position: [4.5, 3.2, -6] as [number, number, number] },
};

/**
 * `fit` decides which stage dimension binds the orthographic zoom:
 * - `contain` keeps the whole `width × height` box inside the stage.
 * - `width` binds the horizontal extent only, so the stage's own aspect ratio
 *   decides how much vertical bleed there is.
 *
 * `pan` shifts camera and target together along the camera's own right/up
 * axes, in world units. For an orthographic camera that translates the view
 * window instead of rotating it, so it recentres the composition without
 * changing the viewing angle: positive Y pushes the world down in frame, which
 * is how the vertical bleed is kept at the bottom edge instead of cutting the
 * ferris wheel off at the top.
 */
export type WorldFraming = {
  position: [number, number, number];
  width: number;
  height: number;
  scale: number;
  fit: "contain" | "width";
  pan: [number, number];
};

export const WORLD_CAMERA: {
  desktop: WorldFraming;
  mobile: WorldFraming;
  lookAt: [number, number, number];
} = {
  // Phase 8 framing: the base is meant to run off the stage at both ends, so the
  // world reads as a place that continues past the frame instead of a product
  // shot floating in cream. Roof, ferris rim and Little Red's eyes stay inside.
  desktop: { position: [7, 10, 12], width: 13.8, height: 9.8, scale: 1.2, fit: "contain", pan: [0, 0] },
  // Portrait phones bind on width so the island never loses its left or right
  // edge; the stage aspect below leaves a little bleed at the bottom only.
  mobile: { position: [5, 10.5, 14], width: 11.9, height: 9.8, scale: 1, fit: "width", pan: [-.17, .3] },
  lookAt: [.18, .65, 0],
};

/**
 * Single source of truth for the stage box. The CSS stage, the offline poster
 * renderer and the framing QA script all read it, so a poster can never drift
 * out of aspect with the live canvas it has to hand over to.
 */
export const HERO_STAGE_ASPECT = { desktop: 1380 / 980, mobile: 11.9 / 5.95 };

export const HERO_POSTER_SIZE = {
  desktop: { width: 1380, height: Math.round(1380 / HERO_STAGE_ASPECT.desktop) },
  mobile: { width: 615, height: Math.round(615 / HERO_STAGE_ASPECT.mobile) },
};
