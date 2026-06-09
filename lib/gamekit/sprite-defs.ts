import type { SpriteAnimationDef } from "./sprite";

const TRUCK_W = 24;
const TRUCK_H = 16;
const FIREFLY = 8;

export const TRUCK_IDLE: SpriteAnimationDef = {
  name: "idle",
  frames: [{ x: 0, y: 0, w: TRUCK_W, h: TRUCK_H }],
  fps: 1,
  loop: true,
};

export const TRUCK_DRIVE: SpriteAnimationDef = {
  name: "drive",
  frames: [
    { x: 0, y: 0, w: TRUCK_W, h: TRUCK_H },
    { x: TRUCK_W, y: 0, w: TRUCK_W, h: TRUCK_H },
  ],
  fps: 8,
  loop: true,
};

export const FIREFLY_BLINK: SpriteAnimationDef = {
  name: "blink",
  frames: [
    { x: 0, y: 0, w: FIREFLY, h: FIREFLY },
    { x: FIREFLY, y: 0, w: FIREFLY, h: FIREFLY },
  ],
  fps: 3,
  loop: true,
};
