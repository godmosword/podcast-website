export type KartStats = {
  id: string;
  name: string;
  emoji: string;
  bodyColor: number;
  accentColor: number;
  engineAccel: number;
  maxSpeed: number;
  brakeForce: number;
  grip: number;
  weight: number;
};

/** 車車故事屋卡司風格數值（原創識別，非任天堂角色）。 */
export const KARTS: KartStats[] = [
  {
    id: "xiaohuang",
    name: "小黃",
    emoji: "🚗",
    bodyColor: 0xffd23f,
    accentColor: 0xe0a800,
    engineAccel: 42,
    maxSpeed: 46,
    brakeForce: 55,
    grip: 9,
    weight: 1,
  },
  {
    id: "monster-truck",
    name: "怪獸卡車",
    emoji: "🚚",
    bodyColor: 0xff8fab,
    accentColor: 0xd64570,
    engineAccel: 38,
    maxSpeed: 42,
    brakeForce: 60,
    grip: 10,
    weight: 1.15,
  },
  {
    id: "xiaohong",
    name: "小紅賽車",
    emoji: "🏎️",
    bodyColor: 0xff5252,
    accentColor: 0xc62828,
    engineAccel: 45,
    maxSpeed: 50,
    brakeForce: 52,
    grip: 8.5,
    weight: 0.95,
  },
];

export function getKart(id: string): KartStats {
  return KARTS.find((k) => k.id === id) ?? KARTS[0];
}
