/** 小遊戲角色 ↔ 首頁故事車種對應（與 data/stories.ts 一致） */
export type CarStarRole = "player" | "police" | "red";

export type CarStarCastEntry = {
  role: CarStarRole;
  storySlug: string;
  vehicle: string;
  name: string;
  shortName: string;
  emoji: string;
  color: string;
  art: string;
};

export const CAR_STAR_CAST: Record<CarStarRole, CarStarCastEntry> = {
  player: {
    role: "player",
    storySlug: "ev",
    vehicle: "電動車",
    name: "未來電動車",
    shortName: "電動車",
    emoji: "🚗",
    color: "#7048e8",
    art: "/games/cars/ev.svg",
  },
  police: {
    role: "police",
    storySlug: "ambulance",
    vehicle: "救護車",
    name: "安安救護車",
    shortName: "安安",
    emoji: "🚑",
    color: "#e03131",
    art: "/games/cars/ambulance.svg",
  },
  red: {
    role: "red",
    storySlug: "racecar",
    vehicle: "賽車",
    name: "小紅賽車",
    shortName: "小紅",
    emoji: "🏎️",
    color: "#e64980",
    art: "/games/cars/racecar.svg",
  },
};

export const CAR_STAR_TUTORIAL = [
  {
    icon: "🚗",
    text: "開電動車，把路上金色星星都吃光！",
  },
  {
    icon: "⭐",
    text: "吃大星星 → 安安和小紅變藍，可以撞他們回家！",
  },
  {
    icon: "❤️",
    text: "小心別被追到，愛心用完就結束囉。",
  },
] as const;
