/**
 * 找故事的主題對照。
 *
 * 下拉只出現 `STORY_FINDER_THEMES` 這七個，順序固定。
 * 每一集只歸一個主題，依字幕裡故事真正在教的那一件事，不依標題關鍵字硬套。
 * 空字串表示尚未指定，篩選時不會被任何主題選到。
 */
export const STORY_FINDER_THEMES = [
  "成長勇氣",
  "責任品格",
  "生活好習慣",
  "情緒管理",
  "交友與合作助人",
  "安全與自我保護",
  "思考與創造",
] as const;

export type StoryFinderTheme = (typeof STORY_FINDER_THEMES)[number];

export type EpisodeThemeRow = {
  readonly ep: number;
  readonly slug: string;
  /** 可見標題，方便對照。篩選不讀這欄。 */
  readonly title: string;
  /** 七個主題之一，或空字串。 */
  readonly theme: StoryFinderTheme | "";
};

export const EPISODE_THEMES: readonly EpisodeThemeRow[] = [
  { ep: 1, slug: "ep-1", title: "神奇的未來電動車", theme: "思考與創造" },
  { ep: 2, slug: "ep-2", title: "小小無人機出任務", theme: "安全與自我保護" },
  { ep: 3, slug: "ep-3", title: "小紅賽車不是第一名也沒關係", theme: "情緒管理" },
  { ep: 4, slug: "ep-4", title: "守信用的鈴鈴清潔車", theme: "責任品格" },
  { ep: 5, slug: "ep-5", title: "東東挖土機的勇氣任務", theme: "成長勇氣" },
  { ep: 6, slug: "ep-6", title: "安安救護車", theme: "交友與合作助人" },
  { ep: 7, slug: "ep-7", title: "高鐵小橘晚到了", theme: "情緒管理" },
  { ep: 8, slug: "ep-8", title: "怪獸卡車輕輕開", theme: "責任品格" },
  { ep: 9, slug: "ep-9", title: "刷牙故事", theme: "生活好習慣" },
  { ep: 10, slug: "ep-10", title: "香香的粽子餐車", theme: "責任品格" },
  { ep: 11, slug: "ep-11", title: "小衝賽車與摩天輪高高", theme: "情緒管理" },
  { ep: 12, slug: "ep-12", title: "警車與巴士合作任務", theme: "交友與合作助人" },
  { ep: 13, slug: "ep-13", title: "鑽地車阿酷的溫柔救援任務", theme: "交友與合作助人" },
  { ep: 14, slug: "ep-14", title: "雙胞胎消防車合作任務", theme: "交友與合作助人" },
  { ep: 15, slug: "ep-15", title: "恐龍車多多洗手故事", theme: "生活好習慣" },
  { ep: 16, slug: "ep-16", title: "噗噗豬來介紹水上樂園", theme: "交友與合作助人" },
  { ep: 17, slug: "ep-17", title: "噗噗豬好害怕怎麼辦", theme: "情緒管理" },
  { ep: 18, slug: "ep-18", title: "小紅賽車玩到不想離開怎麼辦", theme: "情緒管理" },
  { ep: 19, slug: "ep-19", title: "恐龍車多多闖禍了", theme: "安全與自我保護" },
  { ep: 20, slug: "ep-20", title: "水泥車阿尼的101任務", theme: "責任品格" },
  { ep: 21, slug: "ep-21", title: "自動駕駛計程車", theme: "安全與自我保護" },
  { ep: 22, slug: "ep-22", title: "車車笑話比賽", theme: "責任品格" },
  { ep: 23, slug: "ep-23", title: "小紅賽車第一次穿越大山", theme: "安全與自我保護" },
  { ep: 24, slug: "ep-24", title: "小紅賽車與爸爸的故事", theme: "成長勇氣" },
  { ep: 25, slug: "ep-25", title: "小紅賽車進雪山隧道的闖關任務", theme: "安全與自我保護" },
  { ep: 26, slug: "ep-26", title: "流浪小車車的零食派對", theme: "責任品格" },
  { ep: 27, slug: "ep-27", title: "小紅豆汽車勇敢上學", theme: "情緒管理" },
  { ep: 28, slug: "ep-28", title: "畫得很醜也沒關係", theme: "思考與創造" },
  { ep: 29, slug: "ep-29", title: "大黃卡車的運送任務", theme: "思考與創造" },
  { ep: 30, slug: "ep-30", title: "8號蒸汽火車的運送任務", theme: "責任品格" },
  { ep: 31, slug: "ep-31", title: "快樂烤肉的中秋節", theme: "思考與創造" },
  { ep: 32, slug: "ep-32", title: "換牙故事", theme: "生活好習慣" },
  { ep: 33, slug: "ep-33", title: "神奇的油漆車長出自己的樣子", theme: "成長勇氣" },
  { ep: 34, slug: "ep-34", title: "小紅賽車好想生氣怎麼辦？", theme: "情緒管理" },
  { ep: 35, slug: "ep-35", title: "恐龍車多多問為什麼不能一直吃糖果？", theme: "生活好習慣" },
  { ep: 36, slug: "ep-36", title: "電動車與機器人的尋找任務", theme: "思考與創造" },
];

const themeSet = new Set<string>(STORY_FINDER_THEMES);

export function isStoryFinderTheme(value: string): value is StoryFinderTheme {
  return themeSet.has(value);
}

/** 尚未指定、或這集不在對照表裡，回空字串。 */
export function episodeFinderTheme(slug: string): StoryFinderTheme | "" {
  const row = EPISODE_THEMES.find((entry) => entry.slug === slug);
  return row?.theme ?? "";
}
