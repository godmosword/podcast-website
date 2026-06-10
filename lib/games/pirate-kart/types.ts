export type Phase = "start" | "countdown" | "playing" | "won";

export type Keys = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  boost: boolean;
  fire: boolean;
};

export type Cannonball = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  owner: string;
  life: number;
};
