import type { Playground } from "@/data/playgrounds";

type ContextFields = Pick<Playground, "facilities" | "tags"> &
  Partial<Pick<Playground, "indoor" | "tips">>;

/**
 * Contextual filters deliberately use only normalized fields.
 * Do not infer these editorial traits from free-form tips.
 */
const HIGH_ENERGY_TAGS = new Set([
  "放電",
  "遊樂設施",
  "運動",
  "玩水",
  "戲水",
  "戲沙",
  "爬山",
  "騎車",
]);

const HIGH_ENERGY_FACILITIES = new Set([
  "大型溜滑梯",
  "大型遊具",
  "兒童遊戲場",
  "遊戲場",
  "遊樂設施",
  "科學遊具",
  "溜滑梯",
  "鞦韆",
  "球場",
  "水樂園",
  "戲水區",
  "親水區",
  "親水設施",
]);

export function isRainyDayFriendly(place: ContextFields): boolean {
  return place.indoor || place.tags.includes("雨天備案");
}

export function isOutdoorPlace(place: ContextFields): boolean {
  return !place.indoor;
}

export function isEasyParking(place: ContextFields): boolean {
  return (
    place.tags.includes("停車方便") || place.facilities.includes("停車場")
  );
}

export function isStrollerFriendly(place: ContextFields): boolean {
  return (
    place.tags.includes("推車友善") ||
    place.facilities.includes("嬰兒車借用") ||
    place.facilities.includes("嬰兒推車租借")
  );
}

export function isHighEnergy(place: ContextFields): boolean {
  return (
    place.tags.some((tag) => HIGH_ENERGY_TAGS.has(tag)) ||
    place.facilities.some((facility) => HIGH_ENERGY_FACILITIES.has(facility))
  );
}
