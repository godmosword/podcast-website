import { duckZones, eventPlan, scenicEvent } from "@/lib/games/orange-express/events";
import type {
  CourseId,
  DriverId,
  LandmarkId,
  LevelId,
  Passenger,
  PointTask,
  ScenicEventKind,
  ScenicSection,
  SceneId,
  SpeedSign,
  Span,
  Station,
} from "@/lib/games/orange-express/types";

const BONBON: Passenger = { id: "bonbon", name: "Bonbon" };
const MAMI: Passenger = { id: "mami", name: "馬米" };
const XIAONAN: Passenger = { id: "xiaonan", name: "小南" };
/** 小站長多接的一位：節目裡沒有這個角色，卡上只放頭像，不印佔位名字。 */
const DOT: Passenger = { id: "dot", name: "一位朋友", showName: false };

export function courseFor(level: LevelId, driver: DriverId): CourseId {
  if (level === "drive") return driver;
  return level;
}

export type CourseRules = {
  /** 路旁速限牌，速度旗跟著牌子變。 */
  signs: boolean;
  /** 超過速度旗：叮叮＋自動輕煞。沒有的話，桿子自己把速度壓在旗子下面。 */
  autoBrake: boolean;
  /** 指差確認小任務。 */
  pointing: boolean;
  /** 門還沒亮就按開門會少一顆星。低齡只在當下提醒，不扣星。 */
  earlyDoorCosts: boolean;
  /** 停好後按喇叭跟這一站的地標打招呼（不影響星星，結算蓋地標章）。 */
  landmarkGreet: boolean;
  /** 第二站起關門時出發號誌是紅燈，等對向列車過去才轉綠。 */
  redSignal: boolean;
  /** 在鐵橋上按喇叭打招呼（大司機沒有：喇叭任務太多會一路狂按）。 */
  bridgeGreet: boolean;
  /** 速度表上畫速度旗（大司機沒有：看不到牌子，旗子只是多一個要讀的符號）。 */
  speedFlag: boolean;
  /** 旅程：站前插風景段、前窗上緣有路線條（只有大司機）。關掉就回到只有三個站段。 */
  journey: boolean;
};

export const COURSE_RULES: Record<CourseId, CourseRules> = {
  look: {
    signs: false,
    autoBrake: false,
    pointing: false,
    earlyDoorCosts: false,
    landmarkGreet: false,
    redSignal: false,
    bridgeGreet: true,
    speedFlag: true,
    journey: false,
  },
  little: {
    signs: false,
    autoBrake: false,
    pointing: false,
    earlyDoorCosts: false,
    landmarkGreet: false,
    redSignal: false,
    bridgeGreet: true,
    speedFlag: true,
    journey: false,
  },
  // 大司機（2026-11-01 減法）：拿掉速限牌、指差、鐵橋招呼；進站速度旗看不到，超過照樣自動輕煞。
  big: {
    signs: false,
    autoBrake: true,
    pointing: false,
    earlyDoorCosts: true,
    landmarkGreet: true,
    redSignal: false,
    bridgeGreet: false,
    speedFlag: false,
    journey: true,
  },
  captain: {
    signs: true,
    autoBrake: true,
    pointing: true,
    earlyDoorCosts: true,
    landmarkGreet: true,
    redSignal: true,
    bridgeGreet: true,
    speedFlag: true,
    journey: false,
  },
};

type WindowSpec = Pick<Station, "window" | "target" | "greenHalf" | "approachAt" | "approachLimit">;

/**
 * 四組規則只改窗寬、綠區寬、進站點與進站速度旗。目標點都在 0.65。
 * 小小司機的綠區蓋住整個窗：停進月台就是三顆星，只學開與停。
 */
const WINDOWS: Record<CourseId, WindowSpec> = {
  look: {
    window: { start: 0.36, end: 0.92 },
    target: 0.65,
    greenHalf: 0.1,
    approachAt: 0.22,
    approachLimit: 0.5,
  },
  little: {
    window: { start: 0.42, end: 0.88 },
    target: 0.65,
    greenHalf: 0.24,
    approachAt: 0.3,
    approachLimit: 0.45,
  },
  big: {
    window: { start: 0.5, end: 0.8 },
    target: 0.65,
    greenHalf: 0.05,
    approachAt: 0.34,
    approachLimit: 0.4,
  },
  captain: {
    window: { start: 0.58, end: 0.72 },
    target: 0.65,
    greenHalf: 0.025,
    approachAt: 0.4,
    approachLimit: 0.35,
  },
};

type Scenery = {
  scene: SceneId;
  landmark: LandmarkId;
  tunnel: Span | null;
  bridge: Span | null;
  passAt: number | null;
  /** 路上的速限牌（不含進站那一面，那一面跟著 approachAt）。 */
  signs: readonly SpeedSign[];
};

/** 窗外的東西都排在進站點（最早 0.22）之前，停車時前窗只剩月台。 */
const SCENERY: Record<Station["id"], Scenery> = {
  "orange-park": {
    scene: "field",
    landmark: "ferris",
    tunnel: { from: 0.1, to: 0.18 },
    bridge: null,
    passAt: null,
    signs: [
      { at: 0.06, limit: 0.55 },
      { at: 0.19, limit: 0.82 },
    ],
  },
  "orange-slope": {
    scene: "city",
    landmark: "orange-tree",
    tunnel: null,
    bridge: { from: 0.1, to: 0.19 },
    passAt: 0.02,
    signs: [
      { at: 0.08, limit: 0.5 },
      { at: 0.2, limit: 0.82 },
    ],
  },
  "orange-home": {
    scene: "sea",
    landmark: "house",
    tunnel: null,
    bridge: { from: 0.11, to: 0.2 },
    passAt: 0.03,
    signs: [
      { at: 0.09, limit: 0.5 },
      { at: 0.205, limit: 0.82 },
    ],
  },
};

/**
 * 一段風景段的長度（一站的 0–1 為單位）：巡航約 9.5 秒。
 * PR-H4 從 1 拉長到 1.4：新手腳本量起來一趟約 1.6 分鐘（沒有旅程約 0.7 分鐘），
 * 依第一次試玩（舊版不到 2 分鐘）推估真的孩子約 3 分鐘；事件的提示時間也跟著變長。
 */
export const SCENIC_LENGTH = 1.4;

/**
 * 每一站前面幾段風景段：〔風景、站、風景、風景、站、風景、風景、站〕。
 * 第一站只有一段，第一次停車（示範）不會等太久。
 */
const SCENIC_BEFORE = [1, 2, 2] as const;

/** 第 index 站前面的風景段，事件照整趟的排法（攤平成五格）依序放。 */
function scenicFor(id: Station["id"], index: number, plan: readonly ScenicEventKind[]): ScenicSection[] {
  const count = SCENIC_BEFORE[index] ?? 0;
  const first = SCENIC_BEFORE.slice(0, index).reduce<number>((sum, n) => sum + n, 0);
  return Array.from({ length: count }, (_, k) => {
    const kind = plan[first + k];
    return { id: `${id}-scenic-${k}`, length: SCENIC_LENGTH, event: kind ? scenicEvent(kind, SCENIC_LENGTH) : null };
  });
}

/** 出發號誌那題到這裡為止。前窗的出發號誌立得比這遠，整段題目都看得到它。 */
export const SIGNAL_UNTIL = 0.04;

/**
 * 月台題最早在停車目標前這麼遠才出。月台頂只比視線低半公尺，遠處只是地平線上一條細線；
 * 月台近端要到八公尺內，前窗左邊才鋪得出一塊看得出是月台的面（前窗月台從目標前 70 公尺開始，(70 + 8) / 600）。
 */
export const PLATFORM_TASK_LEAD = 0.13;

function pointsFor(id: Station["id"], spec: WindowSpec, signs: readonly SpeedSign[]): PointTask[] {
  const out: PointTask[] = [{ id: `${id}-signal`, kind: "signal", at: 0, until: SIGNAL_UNTIL }];
  const first = signs[0];
  if (first) {
    const from = Math.max(SIGNAL_UNTIL + 0.001, first.at - 0.04);
    out.push({ id: `${id}-sign`, kind: "sign", at: from, until: first.at + 0.05 });
  }
  const platformAt = Math.max(spec.approachAt, spec.target - PLATFORM_TASK_LEAD);
  out.push({ id: `${id}-platform`, kind: "platform", at: platformAt, until: spec.window.end });
  return out;
}

function station(
  course: CourseId,
  id: Station["id"],
  name: string,
  passengers: readonly Passenger[],
  index = 0,
  plan: readonly ScenicEventKind[] = [],
): Station {
  const spec = WINDOWS[course];
  const rules = COURSE_RULES[course];
  const scenery = SCENERY[id];
  const signs: SpeedSign[] = rules.signs
    ? [...scenery.signs, { at: spec.approachAt, limit: spec.approachLimit }]
    : [];
  const scenic = rules.journey ? scenicFor(id, index, plan) : [];
  return {
    id,
    name,
    passengers,
    ...spec,
    scene: scenery.scene,
    landmark: scenery.landmark,
    tunnel: scenery.tunnel,
    bridge: scenery.bridge,
    passAt: scenery.passAt,
    // 小鴨事件前看不到的降速區（在風景段，progress 是負的）。
    slowZones: duckZones({ scenic }),
    // 第一站不放：開局推動力不走最像壞掉。有對向列車的站才放，等待時有東西看。
    holdAtStart: rules.redSignal && index > 0 && scenery.passAt !== null,
    signs,
    points: rules.pointing ? pointsFor(id, spec, scenery.signs) : [],
    scenic,
  };
}

/** 橘色小線。站名都是虛構的，不借用真實路線。seed：沿途事件的排法（只有旅程的規則組用得到）。 */
export function stationsFor(level: LevelId, driver: DriverId = "big", seed = 0): readonly Station[] {
  const course = courseFor(level, driver);
  const plan = COURSE_RULES[course].journey ? eventPlan(seed) : [];
  if (course === "look") {
    return [station(course, "orange-home", "回家", [MAMI, BONBON])];
  }
  const many = course === "captain";
  return [
    station(course, "orange-park", "遊樂園", many ? [BONBON, MAMI] : [BONBON], 0, plan),
    station(course, "orange-slope", "橘子坡", many ? [XIAONAN, DOT] : [XIAONAN], 1, plan),
    station(course, "orange-home", "回家", many ? [MAMI, BONBON] : [MAMI], 2, plan),
  ];
}

export function stopEpsilon(course: CourseId): number {
  if (course === "look") return 0.08;
  if (course === "little") return 0.08;
  if (course === "captain") return 0.04;
  return 0.06;
}
