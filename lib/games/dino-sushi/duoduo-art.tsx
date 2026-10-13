import type { CSSProperties } from "react";
import { useId } from "react";
import type { Mood } from "./reactions";
import {
  DUODUO_DETAIL,
  DUODUO_INK,
  DUODUO_LIGHT,
  DUODUO_PALETTE,
  DUODUO_STICKER,
  DUODUO_STROKE,
  DUODUO_VIEWBOX,
} from "./duoduo-palette";
import {
  spikePath,
  DUODUO_GEOMETRY,
  type DuoDuoGeometry,
  type DuoDuoView,
  type EyeSpec,
} from "./duoduo-geometry";
import styles from "./duoduo-art.module.css";

/**
 * 恐龍車多多。綠車身、淺綠吻部、橘色背刺、暖棕粗眉、頭頂圓眼、藍色側窗、四顆黑輪。
 * 沒有手、沒有腳。預設 3/4、車頭朝右，和封面同一個角度。
 * 嘴只微張，幾顆小圓白牙，不畫牙齦。
 */

export type DuoDuoMouth = "closed" | "open" | "chew" | "laugh";
export type DuoDuoFace = Mood | "idle" | "sleepy";
export type DuoDuoPose = "idle" | "eat" | "rest";
export type { DuoDuoView };

type Props = {
  mouth: DuoDuoMouth;
  face: DuoDuoFace;
  /** 刷過牙：牙齒閃一下。 */
  shinyTeeth?: boolean;
  size?: number | string;
  style?: CSSProperties;
  /** 預設四分之三，局內用這個。角色表才換正面／側面。 */
  view?: DuoDuoView;
  /** 角色表的靜態姿勢。局內的浮動與咀嚼走 CSS。 */
  pose?: DuoDuoPose;
  /** 關掉待機浮動與眨眼（角色表、減少動態的靜態稿）。 */
  animate?: boolean;
};

const P = DUODUO_PALETTE;

function uidOf(raw: string): string {
  return raw.replace(/:/g, "");
}

function poseTransform(pose: DuoDuoPose, anchorX: number): string | undefined {
  if (pose === "idle") return undefined;
  const spin = pose === "eat" ? 6 : -5;
  const sx = pose === "eat" ? 1.04 : 1.02;
  const sy = pose === "eat" ? 0.93 : 0.96;
  return `translate(${anchorX} 118) rotate(${spin}) scale(${sx} ${sy}) translate(${-anchorX} -118)`;
}

function VolumeDefs({ id }: { id: string }) {
  const shade = DUODUO_LIGHT.shade;
  const materials = [P.green, P.muzzle, P.spike, P.window, P.wheel, P.hub, P.metal] as const;
  const names = ["green", "muzzle", "spike", "window", "wheel", "hub", "metal"] as const;
  return (
    <defs>
      {materials.map((tone, i) => (
        <radialGradient
          key={names[i]}
          id={`${id}-${names[i]}`}
          cx={DUODUO_LIGHT.highlight.cx}
          cy={DUODUO_LIGHT.highlight.cy}
          r="78%"
          fx="22%"
          fy="18%"
        >
          <stop offset="0%" stopColor={tone.light} />
          <stop offset="48%" stopColor={tone.base} />
          <stop offset="100%" stopColor={tone.shadow} />
        </radialGradient>
      ))}
      {/* 暗面：左下。每一塊形狀用自己的 bounding box，所以車身、刺、輪子各有一塊。 */}
      <linearGradient id={`${id}-shade`} x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="40%" stopColor={shade} stopOpacity="0" />
        <stop offset="100%" stopColor={shade} stopOpacity={DUODUO_LIGHT.shadeOpacity} />
      </linearGradient>
      <linearGradient id={`${id}-rim`} x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="62%" stopColor={DUODUO_LIGHT.rim} stopOpacity="0" />
        <stop offset="100%" stopColor={DUODUO_LIGHT.rim} stopOpacity="0.9" />
      </linearGradient>
    </defs>
  );
}

function ClayPath({ d, fill, shade, rim }: { d: string; fill: string; shade: string; rim: string }) {
  return (
    <g>
      <path d={d} fill={fill} />
      <path d={d} fill={shade} />
      <path d={d} fill="none" stroke={DUODUO_INK} strokeWidth={DUODUO_STROKE} strokeLinejoin="round" strokeLinecap="round" />
      <path d={d} fill="none" stroke={rim} strokeWidth={1.35} strokeLinejoin="round" />
    </g>
  );
}

function ClayCircle({
  cx,
  cy,
  r,
  fill,
  shade,
  rim,
}: {
  cx: number;
  cy: number;
  r: number;
  fill: string;
  shade: string;
  rim: string;
}) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={fill} />
      <circle cx={cx} cy={cy} r={r} fill={shade} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={DUODUO_INK} strokeWidth={DUODUO_STROKE} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={rim} strokeWidth={1.2} />
    </g>
  );
}

function Wheel({
  cx,
  cy,
  r,
  wheel,
  hub,
  shade,
  rim,
}: {
  cx: number;
  cy: number;
  r: number;
  wheel: string;
  hub: string;
  shade: string;
  rim: string;
}) {
  return (
    <g>
      <ClayCircle cx={cx} cy={cy} r={r} fill={wheel} shade={shade} rim={rim} />
      <circle cx={cx} cy={cy} r={r * 0.46} fill={hub} />
      <circle cx={cx} cy={cy} r={r * 0.46} fill={shade} />
      <circle cx={cx} cy={cy} r={r * 0.46} fill="none" stroke={DUODUO_INK} strokeWidth={DUODUO_DETAIL} />
      <circle cx={cx - r * 0.16} cy={cy - r * 0.18} r={r * 0.14} fill="#fff" opacity="0.85" />
    </g>
  );
}

function Tooth({ cx, cy, shiny }: { cx: number; cy: number; shiny: boolean }) {
  return (
    <g>
      <ellipse cx={cx} cy={cy + 0.6} rx="2.5" ry="2.7" fill={P.tooth.shadow} />
      <ellipse cx={cx} cy={cy} rx="2.35" ry="2.45" fill={shiny ? "#fff" : P.tooth.base} />
      <ellipse cx={cx - 0.5} cy={cy - 0.7} rx="0.7" ry="0.45" fill="#fff" opacity="0.9" />
    </g>
  );
}

function Mouth({
  mouth,
  face,
  shiny,
  cx,
  cy,
  s,
}: {
  mouth: DuoDuoMouth;
  face: DuoDuoFace;
  shiny: boolean;
  cx: number;
  cy: number;
  s: number;
}) {
  const surprised = face === "look" && mouth === "open";
  if (surprised) {
    return (
      <g transform={`translate(${cx} ${cy}) scale(${s})`}>
        <ellipse cx="0" cy="2" rx="5.2" ry="6" fill={P.mouth} stroke={DUODUO_INK} strokeWidth={DUODUO_STROKE} />
      </g>
    );
  }
  if (mouth === "chew") {
    return (
      <g transform={`translate(${cx} ${cy}) scale(${s})`}>
        <path
          d="M -8 2 Q 0 8 8 2"
          fill="none"
          stroke={DUODUO_INK}
          strokeWidth={DUODUO_STROKE}
          strokeLinecap="round"
        />
        <Tooth cx={-3.2} cy={4.2} shiny={shiny} />
        <Tooth cx={3.2} cy={4.2} shiny={shiny} />
        {face === "yum" ? <ellipse cx="0" cy="6.2" rx="2.2" ry="1.5" fill="#F6C6B4" /> : null}
      </g>
    );
  }
  if (mouth === "open" || mouth === "laugh") {
    const wide = mouth === "laugh" ? 1.08 : 1;
    const teeth = mouth === "laugh" ? [-6.5, -2.2, 2.2, 6.5] : [-4.2, 0, 4.2];
    return (
      <g transform={`translate(${cx} ${cy}) scale(${s * wide} ${s})`}>
        <path
          d="M -9 1 C -9 -3 9 -3 9 1 C 10 7 0 9 -9 7 C -10 4 -9 2 -9 1 Z"
          fill={P.mouth}
          stroke={DUODUO_INK}
          strokeWidth={DUODUO_STROKE}
          strokeLinejoin="round"
        />
        {teeth.map((x) => (
          <Tooth key={x} cx={x} cy={1.4} shiny={shiny} />
        ))}
        {shiny ? (
          <path d="M -14 -6 l 1.1 2.3 2.3 1.1 -2.3 1.1 -1.1 2.3 -1.1 -2.3 -2.3 -1.1 2.3 -1.1 Z" fill="#fff" />
        ) : null}
      </g>
    );
  }
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <path
        d="M -12 1 Q 0 6 12 1"
        fill="none"
        stroke={DUODUO_INK}
        strokeWidth={DUODUO_STROKE}
        strokeLinecap="round"
      />
      <Tooth cx={-6} cy={4.2} shiny={shiny} />
      <Tooth cx={0} cy={7.2} shiny={shiny} />
      <Tooth cx={6} cy={4.2} shiny={shiny} />
    </g>
  );
}

function Eye({ eye, face, shade, blink }: { eye: EyeSpec; face: DuoDuoFace; shade: string; blink: boolean }) {
  const { cx, cy, r } = eye;
  if (face === "love") {
    return (
      <g className={blink ? styles.eye : undefined} transform={`translate(${cx} ${cy})`}>
        <path
          d={`M 0 ${r * 0.35} C ${-r * 0.15} ${-r * 0.55} ${-r} ${-r * 0.15} ${-r * 0.55} ${r * 0.15} C ${-r * 0.2} ${r * 0.55} 0 ${r * 0.95} 0 ${r * 0.95} C 0 ${r * 0.95} ${r * 0.2} ${r * 0.55} ${r * 0.55} ${r * 0.15} C ${r} ${-r * 0.15} ${r * 0.15} ${-r * 0.55} 0 ${r * 0.35} Z`}
          fill={P.blush}
          stroke={DUODUO_INK}
          strokeWidth={DUODUO_DETAIL}
          strokeLinejoin="round"
        />
      </g>
    );
  }
  if (face === "puff") {
    return (
      <g className={blink ? styles.eye : undefined}>
        <path
          d={`M ${cx - r} ${cy - r * 0.35} l ${r * 0.85} ${r * 0.45} l ${-r * 0.85} ${r * 0.45}`}
          fill="none"
          stroke={DUODUO_INK}
          strokeWidth={DUODUO_STROKE}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    );
  }
  const look = face === "look";
  const pupilR = r * (look ? 0.58 : 0.48);
  const dx = look ? 0.2 : r * 0.12;
  const dy = look ? -r * 0.16 : r * 0.06;
  return (
    <g className={blink ? styles.eye : undefined}>
      <circle cx={cx} cy={cy} r={r} fill="#fff" stroke={DUODUO_INK} strokeWidth={DUODUO_STROKE} />
      <circle cx={cx + dx} cy={cy + dy} r={pupilR} fill={DUODUO_INK} />
      <circle cx={cx + dx + pupilR * 0.35} cy={cy + dy - pupilR * 0.38} r={pupilR * 0.28} fill="#fff" />
      {face === "yum" ? (
        <path
          d={`M ${cx - r - 1} ${cy + r * 0.15} Q ${cx} ${cy - r * 0.55} ${cx + r + 1} ${cy + r * 0.15} Q ${cx} ${cy + r * 0.85} ${cx - r - 1} ${cy + r * 0.15} Z`}
          fill={P.green.base}
        />
      ) : null}
      {face === "yum" ? <path d={`M ${cx - r} ${cy + 1} Q ${cx} ${cy - r * 0.2} ${cx + r} ${cy + 1}`} fill={shade} /> : null}
      {face === "sleepy" ? (
        <path
          d={`M ${cx - r - 1} ${cy + 1} Q ${cx} ${cy - r - 1} ${cx + r + 1} ${cy + 1} Q ${cx} ${cy - r * 0.05} ${cx - r - 1} ${cy + 1} Z`}
          fill={P.green.base}
        />
      ) : null}
      {face === "sleepy" ? (
        <path
          d={`M ${cx - r * 0.7} ${cy - 0.4} Q ${cx} ${cy + r * 0.15} ${cx + r * 0.7} ${cy - 0.4}`}
          fill="none"
          stroke={DUODUO_INK}
          strokeWidth={DUODUO_DETAIL}
          strokeLinecap="round"
        />
      ) : null}
    </g>
  );
}

function Brows({ face, eyes }: { face: DuoDuoFace; eyes: EyeSpec[] }) {
  const raised = face === "look" || face === "puff";
  const sleepy = face === "sleepy";
  return (
    <g fill={DUODUO_INK}>
      {eyes.map((e) => {
        const y = e.cy - e.r - (raised ? 5.5 : sleepy ? 1.6 : 3.4);
        const lift = raised ? 5 : sleepy ? 1.2 : 3.2;
        const w = e.r * 0.95;
        return (
          <path
            key={`${e.cx}-${e.cy}`}
            d={`M ${e.cx - w} ${y + 1.4} Q ${e.cx} ${y - lift} ${e.cx + w} ${y} Q ${e.cx} ${y - lift + 4.6} ${e.cx - w} ${y + 1.4} Z`}
          />
        );
      })}
    </g>
  );
}

function Hearts({ spots }: { spots: DuoDuoGeometry["hearts"] }) {
  return (
    <g fill={P.blush} stroke={DUODUO_INK} strokeWidth={DUODUO_DETAIL} strokeLinejoin="round">
      {spots.map((h) => (
        <path
          key={`${h.x}-${h.y}`}
          transform={`translate(${h.x} ${h.y}) scale(${h.s})`}
          d="M 0 3.2 C -1.2 -1.6 -7 -0.4 -4.6 3.4 L 0 8 L 4.6 3.4 C 7 -0.4 1.2 -1.6 0 3.2 Z"
        />
      ))}
    </g>
  );
}

function Stars({ spots }: { spots: DuoDuoGeometry["stars"] }) {
  return (
    <g fill="#FFD56A" stroke={DUODUO_INK} strokeWidth={DUODUO_DETAIL} strokeLinejoin="round">
      {spots.map((s) => (
        <path
          key={`${s.x}-${s.y}`}
          transform={`translate(${s.x} ${s.y}) scale(${s.s})`}
          d="M 0 -7 L 1.6 -2.2 L 6.6 -2.2 L 2.6 1 L 4.2 6 L 0 3.2 L -4.2 6 L -2.6 1 L -6.6 -2.2 L -1.6 -2.2 Z"
        />
      ))}
    </g>
  );
}

function Puff({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g fill="#fff" stroke={DUODUO_INK} strokeWidth={DUODUO_DETAIL}>
      <circle cx={cx} cy={cy + 6} r="7" />
      <circle cx={cx - 7} cy={cy - 2} r="8" />
      <circle cx={cx + 5} cy={cy - 4} r="6" />
    </g>
  );
}

function Mark({
  geo,
  face,
  mouth,
  shiny,
  pose,
  id,
  animate,
}: {
  geo: DuoDuoGeometry;
  face: DuoDuoFace;
  mouth: DuoDuoMouth;
  shiny: boolean;
  pose: DuoDuoPose;
  id: string;
  animate: boolean;
}) {
  const shade = `url(#${id}-shade)`;
  const rim = `url(#${id}-rim)`;
  const green = `url(#${id}-green)`;
  const muzzle = `url(#${id}-muzzle)`;
  const spike = `url(#${id}-spike)`;
  const windowFill = `url(#${id}-window)`;
  const wheel = `url(#${id}-wheel)`;
  const hub = `url(#${id}-hub)`;
  const metal = `url(#${id}-metal)`;
  const blushOn = face === "love" || face === "sweet" || face === "yum" || face === "puff" || face === "idle";
  const far = geo.wheels.filter((w) => w.far);
  const near = geo.wheels.filter((w) => !w.far);
  const blink = animate && face !== "sleepy" && face !== "puff";
  return (
    <g transform={poseTransform(pose, geo.anchorX)}>
      <g fill="#fff" stroke="#fff" strokeWidth={DUODUO_STICKER} strokeLinejoin="round" strokeLinecap="round">
        {geo.spikes.map((s) => (
          <path key={`s-${s.x}-${s.y}`} d={spikePath(s)} />
        ))}
        <path d={geo.body} />
        {geo.wheels.map((w) => (
          <circle key={`w-${w.cx}`} cx={w.cx} cy={w.cy} r={w.r} />
        ))}
      </g>
      <rect
        x={geo.exhaust.x}
        y={geo.exhaust.y}
        width={geo.exhaust.w}
        height={geo.exhaust.h}
        rx="4"
        fill={metal}
        stroke={DUODUO_INK}
        strokeWidth={DUODUO_DETAIL}
      />
      {face === "puff" ? <Puff cx={geo.puff.cx} cy={geo.puff.cy} /> : null}
      {geo.spikes.map((s) => (
        <ClayPath key={`c-${s.x}-${s.y}`} d={spikePath(s)} fill={spike} shade={shade} rim={rim} />
      ))}
      {far.map((w) => (
        <Wheel key={`f-${w.cx}`} cx={w.cx} cy={w.cy} r={w.r} wheel={wheel} hub={hub} shade={shade} rim={rim} />
      ))}
      <ClayPath d={geo.body} fill={green} shade={shade} rim={rim} />
      <ellipse
        cx={geo.gloss.cx}
        cy={geo.gloss.cy}
        rx={geo.gloss.rx}
        ry={geo.gloss.ry}
        fill="#fff"
        opacity="0.42"
        transform={`rotate(-28 ${geo.gloss.cx} ${geo.gloss.cy})`}
      />
      {geo.window ? (
        <g>
          <rect
            x={geo.window.x}
            y={geo.window.y}
            width={geo.window.w}
            height={geo.window.h}
            rx={geo.window.rx}
            fill={windowFill}
            stroke={DUODUO_INK}
            strokeWidth={DUODUO_STROKE}
          />
          <rect
            x={geo.window.x}
            y={geo.window.y}
            width={geo.window.w}
            height={geo.window.h}
            rx={geo.window.rx}
            fill={shade}
          />
          <ellipse
            cx={geo.window.x + geo.window.w * 0.32}
            cy={geo.window.y + geo.window.h * 0.28}
            rx={geo.window.w * 0.18}
            ry={geo.window.h * 0.1}
            fill="#fff"
            opacity="0.75"
          />
        </g>
      ) : null}
      <path d={geo.muzzle} fill={muzzle} />
      <path d={geo.muzzle} fill={shade} />
      <path d={geo.muzzleEdge} fill="none" stroke={DUODUO_INK} strokeWidth={DUODUO_STROKE} strokeLinecap="round" />
      <path d={geo.muzzleEdge} fill="none" stroke={rim} strokeWidth={1.2} strokeLinecap="round" />
      {geo.nostrils.map((n) => (
        <ellipse key={`${n.cx}-${n.cy}`} cx={n.cx} cy={n.cy} rx="2.3" ry="1.7" fill={P.muzzle.shadow} />
      ))}
      {blushOn
        ? geo.blush.map((b) => (
            <ellipse key={`${b.cx}-${b.cy}`} cx={b.cx} cy={b.cy} rx="5" ry="3" fill={P.blush} opacity={face === "idle" ? 0.38 : 0.62} />
          ))
        : null}
      <Mouth mouth={mouth} face={face} shiny={shiny} cx={geo.mouth.cx} cy={geo.mouth.cy} s={geo.mouth.s} />
      {geo.eyes.map((e) => (
        <Eye key={`${e.cx}-${e.cy}`} eye={e} face={face} shade={shade} blink={blink} />
      ))}
      <Brows face={face} eyes={geo.eyes} />
      {near.map((w) => (
        <Wheel key={`n-${w.cx}`} cx={w.cx} cy={w.cy} r={w.r} wheel={wheel} hub={hub} shade={shade} rim={rim} />
      ))}
      {near.map((w) => (
        <ClayPath key={`d-${w.cx}`} d={fenderPath(w.cx, w.cy, w.r)} fill={green} shade={shade} rim={rim} />
      ))}
      {face === "love" ? <Hearts spots={geo.hearts} /> : null}
      {face === "sweet" ? <Stars spots={geo.stars} /> : null}
    </g>
  );
}

/** 輪子上緣的擋泥板，讓輪子嵌進車身。 */
function fenderPath(cx: number, cy: number, r: number): string {
  return `M ${cx - r - 1} ${cy - 1} Q ${cx} ${cy - r - 4} ${cx + r + 1} ${cy - 1} L ${cx + r - 1} ${cy + 3} Q ${cx} ${cy - r + 4} ${cx - r + 1} ${cy + 3} Z`;
}

export function DuoDuoArt({
  mouth,
  face,
  shinyTeeth = false,
  size = "100%",
  style,
  view = "three-quarter",
  pose = "idle",
  animate = true,
}: Props) {
  const id = uidOf(useId());
  const eating = mouth === "open" || mouth === "chew" || mouth === "laugh";
  const figureClass = animate ? (eating ? `${styles.figure} ${styles.munch}` : styles.figure) : undefined;
  return (
    <svg
      className={figureClass}
      viewBox={`0 0 ${DUODUO_VIEWBOX.width} ${DUODUO_VIEWBOX.height}`}
      width={size}
      height={size}
      style={style}
      aria-hidden
      focusable="false"
      data-view={view}
      data-face={face}
      data-mouth={mouth}
    >
      <VolumeDefs id={id} />
      <Mark
        geo={DUODUO_GEOMETRY[view]}
        face={face}
        mouth={mouth}
        shiny={shinyTeeth}
        pose={pose}
        id={id}
        animate={animate}
      />
    </svg>
  );
}

/** 刷牙小動作的牙刷（藍白）。線色、線寬跟著多多。 */
export function ToothbrushArt({ size = "100%", style }: { size?: number | string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} style={style} aria-hidden focusable="false">
      <rect x="21" y="16" width="8" height="30" rx="4" fill="#4A90D9" stroke={DUODUO_INK} strokeWidth={DUODUO_STROKE} transform="rotate(-30 25 31)" />
      <rect x="22" y="31" width="5" height="9" rx="2.5" fill="#fff" opacity="0.9" transform="rotate(-30 25 31)" />
      <rect x="9" y="4" width="13" height="14" rx="3" fill="#fff" stroke={DUODUO_INK} strokeWidth={DUODUO_DETAIL} transform="rotate(-30 15 11)" />
      <path d="M10 8h11M10 12h11" stroke="#8DDFF0" strokeWidth={DUODUO_DETAIL} transform="rotate(-30 15 11)" />
      <path d="M6 5c2-3 5-1 7-3s5 0 7-2" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <path d="M6 5c2-3 5-1 7-3s5 0 7-2" fill="none" stroke="#5FB7E8" strokeWidth={DUODUO_DETAIL} strokeLinecap="round" strokeDasharray="2 3" />
    </svg>
  );
}
