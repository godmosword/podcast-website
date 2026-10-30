import type {
  CourseId,
  DriverId,
  LevelId,
  Passenger,
  PointTask,
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
};

export const COURSE_RULES: Record<CourseId, CourseRules> = {
  look: { signs: false, autoBrake: false, pointing: false, earlyDoorCosts: false },
  little: { signs: false, autoBrake: false, pointing: false, earlyDoorCosts: false },
  big: { signs: true, autoBrake: true, pointing: true, earlyDoorCosts: true },
  captain: { signs: true, autoBrake: true, pointing: true, earlyDoorCosts: true },
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
    tunnel: null,
    bridge: { from: 0.11, to: 0.2 },
    passAt: 0.03,
    signs: [
      { at: 0.09, limit: 0.5 },
      { at: 0.205, limit: 0.82 },
    ],
  },
};

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
): Station {
  const spec = WINDOWS[course];
  const rules = COURSE_RULES[course];
  const scenery = SCENERY[id];
  const signs: SpeedSign[] = rules.signs
    ? [...scenery.signs, { at: spec.approachAt, limit: spec.approachLimit }]
    : [];
  return {
    id,
    name,
    passengers,
    ...spec,
    scene: scenery.scene,
    tunnel: scenery.tunnel,
    bridge: scenery.bridge,
    passAt: scenery.passAt,
    signs,
    points: rules.pointing ? pointsFor(id, spec, scenery.signs) : [],
  };
}

/** 橘色小線。站名都是虛構的，不借用真實路線。 */
export function stationsFor(level: LevelId, driver: DriverId = "big"): readonly Station[] {
  const course = courseFor(level, driver);
  if (course === "look") {
    return [station(course, "orange-home", "回家", [MAMI, BONBON])];
  }
  const many = course === "captain";
  return [
    station(course, "orange-park", "遊樂園", many ? [BONBON, MAMI] : [BONBON]),
    station(course, "orange-slope", "橘子坡", many ? [XIAONAN, DOT] : [XIAONAN]),
    station(course, "orange-home", "回家", many ? [MAMI, BONBON] : [MAMI]),
  ];
}

export function stopEpsilon(course: CourseId): number {
  if (course === "look") return 0.08;
  if (course === "little") return 0.08;
  if (course === "captain") return 0.04;
  return 0.06;
}
