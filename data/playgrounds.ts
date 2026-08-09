/**
 * 真實世界親子遊樂地點（sidecar）。
 * 供 /for-parents/play-map 地圖篩選與標記使用；與虛構宇宙地圖無關。
 */

export type PlaygroundType =
  | "公園"
  | "室內樂園"
  | "博物館"
  | "農場"
  | "室內放電"
  | "其他";

export type Playground = {
  id: string;
  name: string;
  city: string;
  district?: string;
  lat: number;
  lng: number;
  address: string;
  type: PlaygroundType;
  ageRange: [number, number];
  free: boolean;
  indoor: boolean;
  facilities: string[];
  tags: string[];
  tips?: string;
  googleMapsUrl?: string;
  officialUrl?: string;
  relatedEpisodes?: string[];
  lastVerified?: string;
};

function mapsSearchUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

const PLAYGROUNDS: readonly Playground[] = [
  {
    id: "ty-fenghe",
    name: "風禾公園",
    city: "桃園市",
    district: "桃園區",
    lat: 25.0018,
    lng: 121.3056,
    address: "桃園市桃園區正光路與大有路口附近",
    type: "公園",
    ageRange: [3, 8],
    free: true,
    indoor: false,
    facilities: ["溜滑梯", "鞦韆", "遮蔭區", "洗手間"],
    tags: ["免費", "大型溜滑梯", "野餐友善"],
    tips: "假日人潮多，建議傍晚去；太陽大時優先找遮蔭遊具區。",
    googleMapsUrl: mapsSearchUrl(25.0018, 121.3056),
    lastVerified: "2026-08-09",
  },
  {
    id: "ty-chingtang",
    name: "青塘園",
    city: "桃園市",
    district: "中壢區",
    lat: 25.0142,
    lng: 121.2145,
    address: "桃園市中壢區青塘路",
    type: "公園",
    ageRange: [3, 8],
    free: true,
    indoor: false,
    facilities: ["環湖步道", "草地", "兒童遊戲場", "洗手間"],
    tags: ["免費", "散步", "餵鴨注意"],
    tips: "適合慢慢散步放電；餵食水鳥請遵守園區規定，也記得帶防蚊液。",
    googleMapsUrl: mapsSearchUrl(25.0142, 121.2145),
    lastVerified: "2026-08-09",
  },
  {
    id: "ty-yangming",
    name: "陽明運動公園",
    city: "桃園市",
    district: "桃園區",
    lat: 25.0206,
    lng: 121.3001,
    address: "桃園市桃園區三民路一段",
    type: "公園",
    ageRange: [3, 8],
    free: true,
    indoor: false,
    facilities: ["兒童遊戲場", "跑道", "籃球場", "停車場"],
    tags: ["免費", "運動", "停車方便"],
    tips: "遊戲場與跑道分開，適合先跑一圈再玩遊具；夏天記得多補水。",
    googleMapsUrl: mapsSearchUrl(25.0206, 121.3001),
    lastVerified: "2026-08-09",
  },
  {
    id: "ty-kids-museum",
    name: "桃園市立兒童美術館",
    city: "桃園市",
    district: "中壢區",
    lat: 24.9935,
    lng: 121.2018,
    address: "桃園市中壢區高鐵南路二段99號",
    type: "博物館",
    ageRange: [3, 8],
    free: true,
    indoor: true,
    facilities: ["展覽", "創作體驗", "洗手間", "親子廁所"],
    tags: ["室內", "免費入場", "雨天備案"],
    tips: "部分體驗活動需現場登記或另收費，出發前可查官網當期活動。",
    googleMapsUrl: mapsSearchUrl(24.9935, 121.2018),
    officialUrl: "https://tmoca.tycg.gov.tw/",
    lastVerified: "2026-08-09",
  },
  {
    id: "ty-casti",
    name: "卡司蒂樂園",
    city: "桃園市",
    district: "中壢區",
    lat: 24.9658,
    lng: 121.2212,
    address: "桃園市中壢區中園路二段501號",
    type: "室內樂園",
    ageRange: [3, 8],
    free: false,
    indoor: true,
    facilities: ["球池", "溜滑梯", "角色扮演區", "洗手間"],
    tags: ["室內放電", "雨天備案", "需購票"],
    tips: "假日建議先查票價與營業時間；襪子通常要自備或現場購買。",
    googleMapsUrl: mapsSearchUrl(24.9658, 121.2212),
    lastVerified: "2026-08-09",
  },
];

export function getPlayground(id: string): Playground | undefined {
  return PLAYGROUNDS.find((item) => item.id === id);
}

export function listPlaygrounds(): readonly Playground[] {
  return PLAYGROUNDS;
}

export function listCities(): string[] {
  return [...new Set(PLAYGROUNDS.map((item) => item.city))].sort((a, b) =>
    a.localeCompare(b, "zh-Hant"),
  );
}
