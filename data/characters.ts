import rawCharacters from "./characters.json";

/** 角色一級資料（canonical 來源：data/characters.json 六位定裝照）。 */
export type Character = {
  id: string;
  name: string;
  vehicle: string;
  personality: string;
  appearsIn: string[];
  ref?: string;
  unlockCondition?: string;
};

type RawCharacter = {
  name: string;
  aliases?: string[];
  vehicle: string;
  desc: string;
  ref: string;
  firstSeen?: string;
};

const ID_BY_CANONICAL_NAME: Record<string, string> = {
  鈴鈴清潔車: "ling-ling",
  恐龍車多多: "duo-duo",
  安安救護車: "an-an",
  小紅賽車: "xiao-hong",
  怪獸卡車: "monster-truck",
  東東挖土機: "dong-dong",
  香香餐車: "xiang-xiang",
};

const VEHICLE_ZH: Record<string, string> = {
  "street sweeper": "清潔車",
  "dinosaur car": "恐龍車",
  ambulance: "救護車",
  "race car": "賽車",
  "monster truck": "怪獸卡車",
  excavator: "挖土機",
  "food truck": "餐車",
};

/** 車種對應的手動維護集數 slug（與 firstSeen 合併）。 */
const VEHICLE_STORY_SLUG: Record<string, string> = {
  "street sweeper": "sweeper",
  ambulance: "ambulance",
  "race car": "racecar",
  excavator: "excavator",
};

const PERSONALITY_BY_ID: Record<string, string> = {
  "an-an": "勇敢、願意開口求助",
  "dong-dong": "有點膽小但願意嘗試",
  "ling-ling": "守信用、說到做到",
  "xiao-hong": "熱愛比賽、學會面對挫折",
  "monster-truck": "大聲勇敢但願意學習溫柔",
  "duo-duo": "愛吃糖、學習好習慣",
  "xiang-xiang": "溫柔分享、把故事和祝福送給大家",
};

function shortName(entry: RawCharacter, id: string): string {
  const aliases = entry.aliases ?? [];
  const preferred = aliases.find((a) => a.length <= 4 && !a.includes("車"));
  if (preferred) return preferred;
  if (id === "monster-truck") return "怪獸卡車";
  return entry.name.replace(/車$/, "").slice(-2) || entry.name;
}

function appearsInFor(entry: RawCharacter): string[] {
  const slugs = new Set<string>();
  if (entry.firstSeen) slugs.add(entry.firstSeen);
  const vehicleSlug = VEHICLE_STORY_SLUG[entry.vehicle];
  if (vehicleSlug) slugs.add(vehicleSlug);
  return Array.from(slugs);
}

function toCharacter(entry: RawCharacter): Character {
  const id = ID_BY_CANONICAL_NAME[entry.name];
  if (!id) {
    throw new Error(`Unknown character in characters.json: ${entry.name}`);
  }
  return {
    id,
    name: shortName(entry, id),
    vehicle: VEHICLE_ZH[entry.vehicle] ?? entry.vehicle,
    personality: PERSONALITY_BY_ID[id] ?? "車車好朋友",
    appearsIn: appearsInFor(entry),
    ref: entry.ref,
  };
}

export const CHARACTERS: Character[] = (rawCharacters as RawCharacter[]).map(
  toCharacter,
);

const byId = new Map(CHARACTERS.map((c) => [c.id, c]));

export function getCharacter(id: string): Character | undefined {
  return byId.get(id);
}

export function getCharactersForStory(slug: string): Character[] {
  return CHARACTERS.filter((c) => c.appearsIn.includes(slug));
}
