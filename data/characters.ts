/** 角色一級資料（圖鑑 UI 預留，本次僅資料層）。 */
export type Character = {
  id: string;
  name: string;
  vehicle: string;
  personality: string;
  appearsIn: string[];
  unlockCondition?: string;
};

export const CHARACTERS: Character[] = [
  {
    id: "an-an",
    name: "安安",
    vehicle: "救護車",
    personality: "勇敢、願意開口求助",
    appearsIn: ["ambulance"],
  },
  {
    id: "dong-dong",
    name: "東東",
    vehicle: "挖土機",
    personality: "有點膽小但願意嘗試",
    appearsIn: ["excavator"],
  },
  {
    id: "ling-ling",
    name: "鈴鈴",
    vehicle: "清潔車",
    personality: "守信用、說到做到",
    appearsIn: ["sweeper"],
  },
  {
    id: "xiao-hong",
    name: "小紅",
    vehicle: "賽車",
    personality: "熱愛比賽、學會面對挫折",
    appearsIn: ["racecar"],
  },
  {
    id: "xiao-fei",
    name: "小飛",
    vehicle: "無人機",
    personality: "樂於助人、遵守飛行規則",
    appearsIn: ["drone"],
  },
  {
    id: "bonbon-ev",
    name: "Bonbon 電動車",
    vehicle: "電動車",
    personality: "充滿想像力與創意",
    appearsIn: ["ev"],
  },
  {
    id: "xiao-ju",
    name: "小橘",
    vehicle: "高鐵",
    personality: "遇到改變不慌張、冷靜想辦法",
    appearsIn: ["ep-7"],
  },
  {
    id: "monster-truck",
    name: "怪獸卡車",
    vehicle: "怪獸卡車",
    personality: "大聲勇敢但願意學習溫柔",
    appearsIn: ["ep-8"],
  },
  {
    id: "duo-duo",
    name: "多多",
    vehicle: "恐龍車",
    personality: "愛吃糖、學習好習慣",
    appearsIn: ["ep-9"],
  },
];

const byId = new Map(CHARACTERS.map((c) => [c.id, c]));

export function getCharacter(id: string): Character | undefined {
  return byId.get(id);
}

export function getCharactersForStory(slug: string): Character[] {
  return CHARACTERS.filter((c) => c.appearsIn.includes(slug));
}
