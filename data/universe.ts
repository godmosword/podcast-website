/**
 * 車車宇宙地圖 — 單一資料來源（M0）。
 * 世界座標為 0–1；runtime 經 worldToStage 轉回 MAP_STAGE px，視覺與既有契約不變。
 */
import { z } from "zod";
import {
  LANDING_SEGMENT_IDS,
  type LandingSegmentId,
} from "@/data/landing-segments";

/** 虛擬地圖舞台（解析度無關的 px 空間；消費端仍用此單位）。 */
export const MAP_STAGE = { width: 1000, height: 720 } as const;

/** 進島預設縮放（對齊 UniverseMap FOCUS_SCALE）。 */
export const ISLAND_FOCUS_ZOOM = 1.6;

export const ZONE_IDS = [
  "car-park",
  "dino",
  "rescue",
  "ocean",
  "forest",
] as const;
export type ZoneId = (typeof ZONE_IDS)[number];

export const zoneStatusSchema = z.enum([
  "open",
  "building",
  "coming",
  "planned",
]);
export type ZoneStatus = z.infer<typeof zoneStatusSchema>;

export const hotspotSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  /** 島圖上優先呈現的 3 個精選地標；完整清單仍在島嶼 sheet。 */
  featured: z.boolean().default(false),
  pos: z.object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
  }),
  action: z.discriminatedUnion("type", [
    z.object({ type: z.literal("link"), href: z.string() }),
    z.object({ type: z.literal("story"), slug: z.string() }),
    z.object({ type: z.literal("locked"), hint: z.string() }),
  ]),
});
export type Hotspot = z.infer<typeof hotspotSchema>;

const softLinkSchema = z.object({
  label: z.string(),
  href: z.string(),
  external: z.boolean().optional(),
});

const landingSegmentIdSchema = z.enum(
  LANDING_SEGMENT_IDS as [LandingSegmentId, ...LandingSegmentId[]],
);

export const zoneSchema = z.object({
  id: z.enum(ZONE_IDS),
  name: z.string(),
  /** 卡片／清單副標（舊稱 teaser） */
  tagline: z.string(),
  status: zoneStatusSchema,
  /** 世界地圖座標 0–1 */
  world: z.object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
  }),
  /** 進島相機目標（center 為 0–1；zoom 對齊既有 scale） */
  camera: z.object({
    center: z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)]),
    zoom: z.number().positive(),
  }),
  /** 島 tile 路徑（舊稱 artTile） */
  sprite: z.string(),
  /** 溫和導向連結（舊稱 softLinks） */
  links: z.array(softLinkSchema).default([]),
  hotspots: z.array(hotspotSchema).default([]),
  /** R0 emoji 摘要（資料／fallback） */
  landmark: z.string(),
  shortName: z.string().optional(),
  childHint: z.string().optional(),
  exploreNote: z.string().optional(),
  buildProgress: z.number().min(0).max(100).optional(),
  bridgeFrom: z.enum(ZONE_IDS).optional(),
  route: z
    .object({ href: z.string(), external: z.boolean().optional() })
    .optional(),
  subSegmentIds: z.array(landingSegmentIdSchema).optional(),
});
export type Zone = z.infer<typeof zoneSchema>;

export const universeSchema = z.object({
  camera: z.object({
    worldZoom: z.number().positive(),
    minZoom: z.number().positive(),
    maxZoom: z.number().positive(),
  }),
  zones: z.array(zoneSchema).min(1),
});
export type Universe = z.infer<typeof universeSchema>;

/** 0–1 → MAP_STAGE px（整數，對齊既有 coord 快照）。 */
export function worldToStage(world: { x: number; y: number }): {
  x: number;
  y: number;
} {
  return {
    x: Math.round(world.x * MAP_STAGE.width),
    y: Math.round(world.y * MAP_STAGE.height),
  };
}

/** MAP_STAGE px → 0–1。 */
export function stageToWorld(coord: { x: number; y: number }): {
  x: number;
  y: number;
} {
  return {
    x: coord.x / MAP_STAGE.width,
    y: coord.y / MAP_STAGE.height,
  };
}

function zoneFromLegacyPx(
  partial: Omit<z.input<typeof zoneSchema>, "world" | "camera" | "sprite"> & {
    coord: { x: number; y: number };
    sprite: string;
    zoom?: number;
  },
): z.input<typeof zoneSchema> {
  const world = stageToWorld(partial.coord);
  const zoom = partial.zoom ?? ISLAND_FOCUS_ZOOM;
  return {
    id: partial.id,
    name: partial.name,
    tagline: partial.tagline,
    status: partial.status,
    world,
    camera: { center: [world.x, world.y], zoom },
    sprite: partial.sprite,
    links: partial.links ?? [],
    hotspots: partial.hotspots ?? [],
    landmark: partial.landmark,
    shortName: partial.shortName,
    childHint: partial.childHint,
    exploreNote: partial.exploreNote,
    buildProgress: partial.buildProgress,
    bridgeFrom: partial.bridgeFrom,
    route: partial.route,
    subSegmentIds: partial.subSegmentIds,
  };
}

/**
 * 權威 raw：以既有 stage px 定義，經 stageToWorld 寫入 0–1。
 * 新增島嶼只改此處（並補 ZONE_TERRAIN／art-tile 契約）。
 */
const raw = {
  camera: {
    // 實際世界鏡頭仍由 fitScale 計算；此值供 M1 targetFor 世界層使用。
    worldZoom: 1,
    minZoom: 0.34,
    maxZoom: 2.0,
  },
  zones: [
    zoneFromLegacyPx({
      id: "car-park",
      name: "車車樂園",
      status: "open",
      coord: { x: 410, y: 495 },
      landmark: "🎡",
      sprite: "/adventures/zones/car-park.png",
      tagline: "故事 · 睡前 · 黏土 · 安全",
      subSegmentIds: [...LANDING_SEGMENT_IDS],
      links: [],
      hotspots: [
        {
          id: "ferris-wheel",
          name: "摩天輪",
          featured: true,
          pos: { x: 0.5, y: 0.28 },
          action: { type: "story", slug: "ep-11" },
        },
        {
          id: "story-gate",
          name: "全部故事",
          featured: true,
          pos: { x: 0.28, y: 0.55 },
          action: { type: "link", href: "/stories" },
        },
        {
          id: "bedtime-nook",
          name: "睡前小窩",
          featured: true,
          pos: { x: 0.72, y: 0.48 },
          action: { type: "link", href: "/topic/睡前" },
        },
        {
          id: "clay-table",
          name: "黏土桌",
          pos: { x: 0.35, y: 0.72 },
          action: {
            type: "link",
            href: "https://www.youtube.com/playlist?list=PLVbyl20K8lOeuJ2ky6dEsmpew7xAxZDhF",
          },
        },
        {
          id: "safety-corner",
          name: "安全角",
          pos: { x: 0.68, y: 0.7 },
          action: { type: "link", href: "/topic/安全" },
        },
        {
          id: "red-racer",
          name: "小紅賽車道",
          pos: { x: 0.48, y: 0.58 },
          action: { type: "story", slug: "ep-3" },
        },
        {
          id: "coloring-booth",
          name: "著色小舖",
          pos: { x: 0.22, y: 0.38 },
          action: { type: "link", href: "/games/coloring-book" },
        },
      ],
    }),
    zoneFromLegacyPx({
      id: "dino",
      name: "恐龍島",
      status: "building",
      coord: { x: 175, y: 300 },
      landmark: "🦕",
      sprite: "/adventures/zones/dino.png",
      buildProgress: 60,
      tagline: "恐龍園區探險故事",
      childHint: "恐龍島在長大",
      exploreNote: "恐龍島還在蓋，現在可以先聽車車故事，之後再回來逛。",
      links: [
        { label: "回故事屋", href: "/stories" },
        { label: "去車車樂園", href: "/" },
      ],
      // M3：恐龍島優先填滿探索點（故事 + 建造中鎖定點）。
      hotspots: [
        {
          id: "story-house",
          name: "故事屋入口",
          featured: true,
          pos: { x: 0.3, y: 0.72 },
          action: { type: "link", href: "/stories" },
        },
        {
          id: "joke-plaza",
          name: "笑話廣場",
          featured: true,
          pos: { x: 0.5, y: 0.55 },
          action: { type: "story", slug: "ep-22" },
        },
        {
          id: "brush-corner",
          name: "刷牙角落",
          featured: true,
          pos: { x: 0.28, y: 0.42 },
          action: { type: "story", slug: "ep-9" },
        },
        {
          id: "aku-tunnel",
          name: "阿酷隧道",
          pos: { x: 0.7, y: 0.48 },
          action: { type: "story", slug: "ep-13" },
        },
        {
          id: "soft-truck",
          name: "輕輕停車格",
          pos: { x: 0.42, y: 0.32 },
          action: { type: "story", slug: "ep-8" },
        },
        {
          id: "wash-station",
          name: "洗手站",
          pos: { x: 0.62, y: 0.68 },
          action: { type: "story", slug: "ep-15" },
        },
        {
          id: "door-care",
          name: "車門小心區",
          pos: { x: 0.78, y: 0.35 },
          action: { type: "story", slug: "ep-19" },
        },
        {
          id: "dino-nest",
          name: "恐龍巢穴",
          pos: { x: 0.55, y: 0.22 },
          action: { type: "locked", hint: "還在蓋喔！巢穴蓋好再來玩。" },
        },
        {
          id: "volcano-view",
          name: "火山觀景台",
          pos: { x: 0.2, y: 0.28 },
          action: {
            type: "locked",
            hint: "火山步道施工中，先去聽恐龍故事吧！",
          },
        },
      ],
      bridgeFrom: "car-park",
    }),
    zoneFromLegacyPx({
      id: "rescue",
      name: "英雄救援隊",
      status: "coming",
      coord: { x: 785, y: 300 },
      landmark: "🚓",
      sprite: "/adventures/zones/rescue.png",
      tagline: "冒險救援故事（救援小隊出動）",
      childHint: "救援隊快來了",
      exploreNote:
        "救援隊快要登場，現在可以先回故事屋找警車、消防車、救護車。",
      links: [
        { label: "找車車故事", href: "/stories" },
        { label: "去車車樂園", href: "/" },
      ],
      hotspots: [
        {
          id: "police-bus",
          name: "警車巴士站",
          featured: true,
          pos: { x: 0.35, y: 0.45 },
          action: { type: "story", slug: "ep-12" },
        },
        {
          id: "twin-fire",
          name: "雙子消防局",
          featured: true,
          pos: { x: 0.65, y: 0.4 },
          action: { type: "story", slug: "ep-14" },
        },
        {
          id: "ambulance-bay",
          name: "安安救護站",
          featured: true,
          pos: { x: 0.48, y: 0.62 },
          action: { type: "story", slug: "ep-6" },
        },
        {
          id: "drone-pad",
          name: "無人機停機坪",
          pos: { x: 0.28, y: 0.68 },
          action: { type: "story", slug: "ep-2" },
        },
        {
          id: "command-hq",
          name: "指揮中心",
          pos: { x: 0.55, y: 0.25 },
          action: {
            type: "locked",
            hint: "指揮中心快開幕了，先去聽救援故事熱身！",
          },
        },
        {
          id: "rescue-stories",
          name: "救援故事櫃",
          pos: { x: 0.75, y: 0.65 },
          action: { type: "link", href: "/stories" },
        },
      ],
      bridgeFrom: "forest",
    }),
    zoneFromLegacyPx({
      id: "ocean",
      name: "未來夢想島",
      status: "planned",
      coord: { x: 825, y: 560 },
      landmark: "🌊",
      sprite: "/adventures/zones/ocean.png",
      tagline: "海洋？太空？慢慢蒐集想法",
      childHint: "還在慢慢想",
      exploreNote: "這座島還在規劃，我們先把想法收好，不急著做選擇。",
      links: [
        { label: "先聽一集故事", href: "/stories" },
        { label: "回車車樂園", href: "/" },
      ],
      hotspots: [
        {
          id: "wave-park",
          name: "水上樂園門口",
          featured: true,
          pos: { x: 0.4, y: 0.55 },
          action: { type: "story", slug: "ep-16" },
        },
        {
          id: "drift-river",
          name: "漂漂河",
          featured: true,
          pos: { x: 0.62, y: 0.42 },
          action: { type: "story", slug: "ep-17" },
        },
        {
          id: "goodbye-pier",
          name: "再見碼頭",
          featured: true,
          pos: { x: 0.55, y: 0.7 },
          action: { type: "story", slug: "ep-18" },
        },
        {
          id: "dream-dock",
          name: "夢想碼頭",
          pos: { x: 0.3, y: 0.32 },
          action: {
            type: "locked",
            hint: "夢想碼頭還在蒐集想法，不急著出發喔。",
          },
        },
        {
          id: "ocean-stories",
          name: "先聽一集",
          pos: { x: 0.72, y: 0.6 },
          action: { type: "link", href: "/stories" },
        },
      ],
      bridgeFrom: "rescue",
    }),
    zoneFromLegacyPx({
      id: "forest",
      name: "森林小島",
      status: "building",
      // 偏東北，錯開車車樂園正上方，避免木牌壓到摩天輪
      // y 取 175：再往上 tile 頂會超出 MAP_STAGE，撐破島群 fit bbox
      coord: { x: 580, y: 175 },
      landmark: "🌲",
      sprite: "/adventures/zones/forest.png",
      buildProgress: 45,
      tagline: "樹林裡的小探險，敬請期待",
      childHint: "森林正在長大",
      exploreNote: "森林小島正在長大，現在先把它當成地圖上的散步點。",
      links: [
        { label: "回故事屋", href: "/stories" },
        { label: "去車車樂園", href: "/" },
      ],
      hotspots: [
        {
          id: "dong-dong-dig",
          name: "東東工地",
          featured: true,
          pos: { x: 0.45, y: 0.55 },
          action: { type: "story", slug: "ep-5" },
        },
        {
          id: "treehouse",
          name: "樹屋",
          featured: true,
          pos: { x: 0.62, y: 0.35 },
          action: { type: "locked", hint: "樹屋還在長高，蓋好再上來玩！" },
        },
        {
          id: "forest-trail",
          name: "森林步道",
          featured: true,
          pos: { x: 0.3, y: 0.4 },
          action: {
            type: "locked",
            hint: "步道舖木屑中，先去聽東東的勇氣故事吧。",
          },
        },
        {
          id: "forest-stories",
          name: "故事屋入口",
          pos: { x: 0.7, y: 0.65 },
          action: { type: "link", href: "/stories" },
        },
      ],
      bridgeFrom: "car-park",
    }),
  ],
} satisfies z.input<typeof universeSchema>;

export const universe: Universe = universeSchema.parse(raw);

export const zoneById = (id: string): Zone | undefined =>
  universe.zones.find((z) => z.id === id);

export const statusCounts = (
  zones: readonly { status: ZoneStatus }[] = universe.zones,
): Record<ZoneStatus, number> =>
  zones.reduce<Record<ZoneStatus, number>>(
    (acc, z) => {
      acc[z.status] += 1;
      return acc;
    },
    { open: 0, building: 0, coming: 0, planned: 0 },
  );

/**
 * 狀態顯示文字／圖示／色票（單一來源；元件勿各自 switch）。
 * `ZONE_STATUS_META` 為相容別名。
 */
export const STATUS_META: Record<
  ZoneStatus,
  {
    label: string;
    /** 學齡前語意 icon：開放🎉／施工🚧／禮物🎁／想想💭 */
    icon: string;
    pillBg: string;
    pillInk: string;
    clickable: boolean;
    /** 點擊未開放島時的短暫對話泡泡文案（舊 UX；資料保留） */
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

/** @deprecated 請改用 STATUS_META；保留給既有 import。 */
export const ZONE_STATUS_META = STATUS_META;
