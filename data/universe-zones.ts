/** 車車宇宙：園區（島）資料模型。地圖即路線圖。 */
import { LANDING_SEGMENT_IDS, type LandingSegmentId } from "@/data/landing-segments";
import { zoneArtTilePath } from "@/lib/universe/zone-art-tile";

/** 虛擬地圖座標空間（解析度無關，resolver 再換算成像素）。 */
export const MAP_STAGE = { width: 1000, height: 720 } as const;

export type ZoneId = "car-park" | "dino" | "rescue" | "ocean" | "forest";

/** open=開放 / building=建造中 / coming=即將登場 / planned=規劃中（海上霧區） */
export type ZoneStatus = "open" | "building" | "coming" | "planned";

export type ZoneCoord = { x: number; y: number }; // 0..MAP_STAGE.width / height

export type ZoneDef = {
  id: ZoneId;
  name: string; // 車車樂園
  shortName?: string;
  status: ZoneStatus;
  coord: ZoneCoord; // 島中心
  /** R0 emoji 摘要（資料／fallback）；R1 地圖顯示用 `ZoneLandmarkArt` */
  landmark: string; // "🎡" / "🦕" ...
  /** 可選靜態 tile（`/adventures/zones/{id}.png`）；未設則用 inline SVG */
  artTile?: string;
  teaser: string; // 卡片副標
  /** 未開放島嶼兒童首屏短句（≤10 字；≠ exploreNote 截短）。 */
  childHint?: string;
  /** 未開放島嶼的低壓探索說明：先告知狀態，不要求互動或投票。 */
  exploreNote?: string;
  /** 未開放島嶼可提供的溫和導向，例如回故事屋或已開放園區。 */
  softLinks?: { label: string; href: string; external?: boolean }[];
  buildProgress?: number; // status=building 時 0..100
  /** 連到哪一座島的橋來源（resolver 用來生成橋路徑） */
  bridgeFrom?: ZoneId;
  /** open 島才需要：點擊後導向。可為內部路由或外連。 */
  route?: { href: string; external?: boolean };
  /** 僅 car-park：子設施＝既有四段 segment（單一資料源，勿重刻 href） */
  subSegmentIds?: LandingSegmentId[];
};

export const ZONE_IDS: ZoneId[] = ["car-park", "dino", "rescue", "ocean", "forest"];

/** 各島 SVG 底座配色（固定淺色，不隨日夜反轉） */
export const ZONE_TERRAIN: Record<ZoneId, { sand: string; grass: string }> = {
  "car-park": { sand: "#f3e3bd", grass: "#dcefc4" },
  dino: { sand: "#f0e0b8", grass: "#d4efc0" },
  rescue: { sand: "#f2e4c8", grass: "#cfe8dc" },
  ocean: { sand: "#ebe4d4", grass: "#d0e4f5" },
  forest: { sand: "#ede0c4", grass: "#b8dfa8" },
};

export const ZONES: ZoneDef[] = [
  {
    id: "car-park",
    name: "車車樂園",
    status: "open",
    coord: { x: 500, y: 400 },
    landmark: "🎡",
    artTile: zoneArtTilePath("car-park"),
    teaser: "故事 · 睡前 · 黏土 · 安全",
    subSegmentIds: [...LANDING_SEGMENT_IDS], // 子連結由 LANDING_SEGMENTS 衍生
  },
  {
    id: "dino",
    name: "恐龍島",
    status: "building",
    coord: { x: 210, y: 260 },
    landmark: "🦕",
    artTile: zoneArtTilePath("dino"),
    buildProgress: 60,
    teaser: "恐龍園區探險故事",
    childHint: "恐龍島在長大",
    exploreNote: "恐龍島還在蓋，現在可以先聽車車故事，之後再回來逛。",
    softLinks: [
      { label: "回故事屋", href: "/stories" },
      { label: "去車車樂園", href: "/" },
    ],
    bridgeFrom: "car-park",
  },
  {
    id: "rescue",
    name: "英雄救援隊",
    status: "coming",
    coord: { x: 820, y: 250 },
    landmark: "🚓",
    artTile: zoneArtTilePath("rescue"),
    teaser: "冒險救援故事（救援小隊出動）",
    childHint: "救援隊快來了",
    exploreNote: "救援隊快要登場，現在可以先回故事屋找警車、消防車、救護車。",
    softLinks: [
      { label: "找車車故事", href: "/stories" },
      { label: "去車車樂園", href: "/" },
    ],
    bridgeFrom: "car-park",
  },
  {
    id: "ocean",
    name: "未來夢想島",
    status: "planned",
    coord: { x: 820, y: 560 },
    landmark: "🌊",
    artTile: zoneArtTilePath("ocean"),
    teaser: "海洋？太空？慢慢蒐集想法",
    childHint: "還在慢慢想",
    exploreNote: "這座島還在規劃，我們先把想法收好，不急著做選擇。",
    softLinks: [
      { label: "先聽一集故事", href: "/stories" },
      { label: "回車車樂園", href: "/" },
    ],
    bridgeFrom: "car-park",
  },
  {
    id: "forest",
    name: "森林小島",
    status: "building",
    coord: { x: 210, y: 560 },
    landmark: "🌲",
    artTile: zoneArtTilePath("forest"),
    buildProgress: 45,
    teaser: "樹林裡的小探險，敬請期待",
    childHint: "森林正在長大",
    exploreNote: "森林小島正在長大，現在先把它當成地圖上的散步點。",
    softLinks: [
      { label: "回故事屋", href: "/stories" },
      { label: "去車車樂園", href: "/" },
    ],
    bridgeFrom: "car-park",
  },
];

/** 狀態 → pill 文案/配色（單一來源，元件勿各自硬刻）。
 *  icon 為純呈現欄位（學齡前不識字，pill 文字前綴語意 emoji）；
 *  不動 zone 幾何 schema（id／coord／artTile）。 */
export const ZONE_STATUS_META: Record<
  ZoneStatus,
  {
    label: string;
    /** 學齡前語意 icon：開放🎉／施工🚧／禮物🎁／想想💭 */
    icon: string;
    pillBg: string;
    pillInk: string;
    clickable: boolean;
    /** 點擊未開放島時的短暫對話泡泡文案 */
    tapBubble?: string;
  }
> = {
  open: {
    label: "開放中",
    icon: "🎉",
    pillBg: "#bfe3c4",
    pillInk: "#14532d",
    clickable: true,
  },
  building: {
    label: "建造中",
    icon: "🚧",
    pillBg: "#f5e0a6",
    pillInk: "#6b4e09",
    clickable: true,
    tapBubble: "還在蓋喔！",
  },
  coming: {
    label: "即將登場",
    icon: "🎁",
    pillBg: "#cfe6f5",
    pillInk: "#14455f",
    clickable: true,
    tapBubble: "快要開幕囉！",
  },
  planned: {
    label: "規劃中",
    icon: "💭",
    pillBg: "#e2dcef",
    pillInk: "#41356b",
    clickable: true,
    tapBubble: "先逛逛吧！",
  },
};
