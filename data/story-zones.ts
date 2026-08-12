/** 各集對應的樂園地圖 zone（sidecar，以 slug 為 key）。
 *
 * 對映原則（2026-07-06 back catalog 補完）：
 * - car-park：一般車輛／樂園場景（摩天輪＝car-park 地標）預設島。
 * - dino：恐龍車與恐龍島選角（阿酷、怪獸卡車為 dino 島 roamer）。
 * - rescue：救援任務向（消防／警車／救護／出任務）。
 * - forest：森林工程與自然向（森林島美術＝大樹＋木架工程）。
 * - ocean：水上／未來向（未來夢想島 teaser「海洋？太空？」）。
 * 建造中／即將登場島的故事會在鎖島 sheet 顯示「這座島已經有的故事」。
 */
import type { ZoneId } from "./universe-zones";

const STORY_ZONES: Record<string, ZoneId> = {
  "ep-1": "car-park", // 神奇的未來電動車
  "ep-2": "rescue", // 小小無人機出任務
  "ep-3": "car-park", // 小紅賽車不是第一名也沒關係
  "ep-4": "car-park", // 守信用的鈴鈴清潔車
  "ep-5": "forest", // 東東挖土機的勇氣任務
  "ep-6": "rescue", // 安安救護車
  "ep-7": "car-park", // 高鐵小橘晚到了
  "ep-8": "dino", // 怪獸卡車輕輕開（dino 島 roamer 選角）
  "ep-9": "dino", // 恐龍車多多的大黃牙
  "ep-10": "car-park", // 香香的粽子餐車
  "ep-11": "car-park", // 小衝賽車與摩天輪高高（摩天輪＝car-park 地標）
  "ep-12": "rescue", // 警車與巴士合作任務
  "ep-13": "dino", // 鑽地車阿酷的溫柔救援任務（阿酷＝dino 島 roamer）
  "ep-14": "rescue", // 雙胞胎消防車合作任務
  "ep-15": "dino", // 恐龍車多多洗手故事
  "ep-16": "ocean", // 噗噗豬來介紹水上樂園
  "ep-17": "ocean", // 漂漂河裡的神祕聲音
  "ep-18": "ocean", // 水上樂園練習說再見
  "ep-19": "dino", // 恐龍車多多闖禍了
  "ep-20": "car-park", // 水泥車阿尼的101任務
  "ep-21": "car-park", // 自動駕駛計程車
  "ep-22": "dino", // 車車笑話比賽
  "ep-23": "car-park", // 小紅賽車第一次穿越大山
  "ep-24": "car-park", // 小紅賽車與爸爸
  "ep-25": "car-park", // 小紅賽車進雪山隧道的闖關任務
};

export function getStoryZoneId(slug: string): ZoneId | undefined {
  return STORY_ZONES[slug];
}
