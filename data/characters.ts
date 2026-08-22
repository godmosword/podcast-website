import { canonicalStorySlug } from "@/lib/story-slug-aliases";
import rawCharacters from "./characters.json";
/** 角色一級資料（canonical 來源：data/characters.json）。 */
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
  /** 除 firstSeen／車種預設集外，另出現的 slug */
  alsoIn?: string[];
};

const ID_BY_CANONICAL_NAME: Record<string, string> = {
  鈴鈴清潔車: "ling-ling",
  恐龍車多多: "duo-duo",
  安安救護車: "an-an",
  小紅賽車: "xiao-hong",
  藍色小巴士: "lan-ba-shi",
  黃色計程車: "huang-ji-cheng",
  怪獸卡車: "monster-truck",
  東東挖土機: "dong-dong",
  吊車老爺爺: "diao-che",
  小橘高鐵: "xiao-ju-hsr",
  小南: "xiao-nan",
  三輪車: "san-lun-che",
  香香餐車: "xiang-xiang",
  沃特: "watt",
  Bonbon: "bong-bong",
  馬米: "mami",
  小飛: "xiao-fei",
  高高摩天輪: "gao-gao",
  小柔露營車: "xiao-rou",
  小衝賽車: "xiao-chong",
  亮亮警車: "liang-liang",
  阿酷鑽地車: "a-ku",
  嘟嘟小紅車: "dudu",
  消防車圈圈: "quan-quan",
  消防車點點: "dian-dian",
  老爺爺爆米花餐車: "popcorn-truck",
  消毒車噴噴: "pen-pen",
  髒髒小怪獸: "dirty-germs",
  噗噗豬: "pu-pu-pig",
  海龜老師暖暖: "nuan-nuan-turtle",
  水泥車阿尼: "a-ni",
  自動駕駛計程車知知: "zhi-zhi",
  小紅賽車的爸爸: "xiao-hong-dad",
  小紅賽車年幼版: "xiao-hong-baby",
  小紅賽車的爸爸年輕版: "xiao-hong-dad-young",
};

const VEHICLE_ZH: Record<string, string> = {
  "street sweeper": "清潔車",
  "dinosaur car": "恐龍車",
  ambulance: "救護車",
  "race car": "賽車",
  "baby race car": "Baby 賽車",
  "young race car": "年輕賽車",
  minibus: "小巴士",
  taxi: "計程車",
  "monster truck": "怪獸卡車",
  萌萌: "怪獸卡車",
  excavator: "挖土機",
  "drill excavator": "鑽地車",
  "crane truck": "吊車",
  tricycle: "三輪車",
  "food truck": "餐車",
  robot: "小機器人",
  child: "小朋友",
  host: "主持人",
  drone: "無人機",
  "high speed rail": "高鐵",
  "MRT train": "捷運",
  "ferris wheel": "摩天輪",
  "camper van": "露營車",
  "police car": "警車",
  car: "小汽車",
  "fire engine": "消防車",
  "spray truck": "消毒車",
  creature: "小怪獸",
  "tour car": "遊園車",
  "sea turtle": "海龜",
  "cement mixer": "水泥車",
  robotaxi: "自動駕駛計程車",
};

/** 車種對應的手動維護集數 slug（與 firstSeen 合併）。 */
const VEHICLE_STORY_SLUG: Record<string, string> = {
  "street sweeper": "ep-4",
  ambulance: "ep-6",
  "race car": "ep-3",
  excavator: "ep-5",
  "high speed rail": "ep-7",
  "monster truck": "ep-8",
  "ferris wheel": "ep-11",
  "camper van": "ep-11",
  "police car": "ep-12",
};

const PERSONALITY_BY_ID: Record<string, string> = {
  "an-an": "勇敢、願意開口求助",
  "dong-dong": "有點膽小但願意嘗試",
  "diao-che": "溫柔鼓勵、教東東一小步一小步來",
  "san-lun-che": "需要幫忙時會害怕，但事後會感謝大家一起合作",
  "ling-ling": "守信用、說到做到",
  "xiao-hong": "熱愛比賽、學會面對挫折",
  "lan-ba-shi": "溫柔安慰、鼓勵朋友完成比賽",
  "huang-ji-cheng": "開朗努力、贏了也會感謝對手",
  "monster-truck": "大聲勇敢但願意學習溫柔",
  "duo-duo": "愛吃糖、學習好習慣",
  "xiang-xiang": "溫柔分享、把故事和祝福送給大家",
  watt: "客氣有禮、車內小幫手",
  "bong-bong": "充滿好奇心與活力",
  mami: "溫暖引導、和小朋友聊天",
  "xiao-fei": "樂於助人、遵守飛行安全規則",
  "xiao-ju-hsr": "溫柔說明狀況、把安全放在第一位",
  "xiao-nan": "可靠載送、溫暖陪伴轉乘",
  "gao-gao": "溫柔慢轉、帶大家看風景",
  "xiao-rou": "需要安靜與安慰、溫柔貼心",
  "xiao-chong": "愛速度、說話直接",
  "liang-liang": "冷靜穩重、守護大家安全",
  "a-ku": "外表酷酷、專心工作、其實溫柔體貼",
  dudu: "表情超豐富、活潑愛打招呼",
  "quan-quan": "有點好強、後來學會和弟弟合作",
  "dian-dian": "不服輸、需要哥哥一起完成任務",
  "popcorn-truck": "親切分享、偶爾需要救援",
  "pen-pen": "驕傲愛逞強、後來學會酒精不能取代洗手",
  "dirty-germs": "調皮躲藏、怕肥皂和清水",
  "pu-pu-pig": "歡樂開朗、愛帶大家認識新地方",
  "nuan-nuan-turtle": "溫柔耐心、教小朋友慢慢認識新朋友",
  "a-ni": "認真負責、默默把地基打穩",
  "zhi-zhi": "溫柔提醒、陪大家平安到達想去的地方",
  "xiao-hong-dad": "溫柔耐心、陪小紅安全完成第一次穿越大山",
  "xiao-hong-baby": "小小軟軟、愛吸香草奶嘴、需要爸爸陪伴",
  "xiao-hong-dad-young": "年輕溫暖、陪 Baby 小紅慢慢練習長大",
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
  for (const slug of entry.alsoIn ?? []) slugs.add(slug);
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

const CHARACTERS: Character[] = (rawCharacters as RawCharacter[]).map(
  toCharacter,
);

const CHARACTER_NAME_BY_ID = new Map(
  (rawCharacters as RawCharacter[]).map((entry) => [
    ID_BY_CANONICAL_NAME[entry.name],
    entry.name,
  ]),
);

export function getCharacters(): Character[] {
  return CHARACTERS;
}

export function getCharactersForStory(slug: string): Character[] {
  const canonical = canonicalStorySlug(slug);
  return CHARACTERS.filter((c) => c.appearsIn.includes(canonical));
}

export function getCharacterName(id: string): string | null {
  return CHARACTER_NAME_BY_ID.get(id) ?? null;
}
