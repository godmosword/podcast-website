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
    coord: { x: 210, y: 280 },
    landmark: "🦕",
    artTile: zoneArtTilePath("dino"),
    buildProgress: 60,
    teaser: "恐龍園區探險故事",
    bridgeFrom: "car-park",
  },
  {
    id: "rescue",
    name: "英雄救援隊",
    status: "coming",
    coord: { x: 820, y: 270 },
    landmark: "🚓",
    artTile: zoneArtTilePath("rescue"),
    teaser: "冒險救援故事（救援小隊出動）",
    bridgeFrom: "car-park",
  },
  {
    id: "ocean",
    name: "未來園區",
    status: "planned",
    coord: { x: 820, y: 560 },
    landmark: "🌊",
    artTile: zoneArtTilePath("ocean"),
    teaser: "海洋？太空？之後開放投票",
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
    bridgeFrom: "car-park",
  },
];

/** 狀態 → pill 文案/配色（單一來源，元件勿各自硬刻） */
export const ZONE_STATUS_META: Record<
  ZoneStatus,
  {
    label: string;
    pillBg: string;
    pillInk: string;
    clickable: boolean;
    /** 點擊未開放島時的短暫對話泡泡文案 */
    tapBubble?: string;
  }
> = {
  open: { label: "開放中", pillBg: "#bfe3c4", pillInk: "#14532d", clickable: true },
  building: {
    label: "建造中",
    pillBg: "#f5e0a6",
    pillInk: "#6b4e09",
    clickable: true,
    tapBubble: "還在蓋喔！",
  },
  coming: {
    label: "即將登場",
    pillBg: "#cfe6f5",
    pillInk: "#14455f",
    clickable: true,
    tapBubble: "快要開幕囉！",
  },
  planned: {
    label: "規劃中",
    pillBg: "#e2dcef",
    pillInk: "#41356b",
    clickable: true,
    tapBubble: "先許願吧！",
  },
};
