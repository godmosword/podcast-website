/** 車庫解鎖：累積星星數解鎖故事車車朋友。 */
type GarageVehicle = {
  id: string;
  name: string;
  emoji: string;
  starsRequired: number;
};

const GARAGE_VEHICLES: GarageVehicle[] = [
  { id: "小黃", name: "小黃", emoji: "🚗", starsRequired: 0 },
  { id: "怪獸卡車", name: "怪獸卡車", emoji: "🚚", starsRequired: 3 },
  { id: "小紅賽車", name: "小紅賽車", emoji: "🏎️", starsRequired: 6 },
  { id: "安安救護車", name: "安安救護車", emoji: "🚑", starsRequired: 10 },
  { id: "恐龍車多多", name: "恐龍車多多", emoji: "🦕", starsRequired: 15 },
];

export function vehiclesUnlockedAt(stars: number): string[] {
  return GARAGE_VEHICLES.filter((v) => stars >= v.starsRequired).map((v) => v.id);
}
