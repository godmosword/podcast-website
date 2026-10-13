import type { CSSProperties } from "react";
import type { Mood } from "./reactions";

/**
 * 恐龍車多多（canon：綠車身＋淺綠吻部、橘色背刺、粗黑眉、頭頂大圓眼、藍色側窗、四顆黑輪、無手腳）。
 * 3/4 正面，車頭朝右。消消樂的淡紫多多是糖果色，不是角色 canon。
 */

export type DuoDuoMouth = "closed" | "open" | "chew" | "laugh";
export type DuoDuoFace = Mood | "idle";

type Props = {
  mouth: DuoDuoMouth;
  face: DuoDuoFace;
  /** 刷過牙：牙齒變白並閃一下。 */
  shinyTeeth?: boolean;
  size?: number | string;
  style?: CSSProperties;
};

const GREEN = "#5cb83a";
const GREEN_DARK = "#3f8f2a";
const MUZZLE = "#8fd14f";
const SPIKE = "#f28a2e";
const SPIKE_DARK = "#cf6a1a";
const INK = "#2c2a28";

function Wheel({ cx, cy, r = 9 }: { cx: number; cy: number; r?: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={INK} />
      <circle cx={cx} cy={cy} r={r * 0.45} fill="#9a958f" />
      <circle cx={cx - r * 0.2} cy={cy - r * 0.25} r={r * 0.16} fill="#fff" opacity="0.5" />
    </g>
  );
}

function Spike({ d }: { d: string }) {
  return <path d={d} fill={SPIKE} stroke={SPIKE_DARK} strokeWidth="1.8" strokeLinejoin="round" />;
}

function Eyes({ face }: { face: DuoDuoFace }) {
  if (face === "love") {
    return (
      <g fill="none" stroke={INK} strokeWidth="3.4" strokeLinecap="round">
        <path d="M54 33q7-8 14 0M78 33q7-8 14 0" />
      </g>
    );
  }
  if (face === "puff") {
    return (
      <g fill="none" stroke={INK} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M55 27l10 5-10 5M91 27l-10 5 10 5" />
      </g>
    );
  }
  const pupil = face === "look" ? { dx: -2.6, dy: -3.4 } : { dx: 0.8, dy: 0.6 };
  return (
    <g>
      {[61, 85].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={32} r="10" fill="#fff" stroke={INK} strokeWidth="2" />
          <circle cx={cx + pupil.dx} cy={32 + pupil.dy} r="5" fill={INK} />
          <circle cx={cx + pupil.dx + 1.8} cy={32 + pupil.dy - 1.8} r="1.7" fill="#fff" />
          {/* 好吃：臉頰往上推、眼睛下半被蓋住（瞇眼笑），不是畫一條線（大尺寸會像黑眼圈） */}
          {face === "yum" ? <path d={`M${cx - 11.5} 45Q${cx} 32 ${cx + 11.5} 45Z`} fill={GREEN} /> : null}
          {face === "yum" ? <path d={`M${cx - 9.5} 42.6Q${cx} 34.4 ${cx + 9.5} 42.6`} fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" /> : null}
        </g>
      ))}
    </g>
  );
}

function Brows({ face }: { face: DuoDuoFace }) {
  const raised = face === "look" || face === "puff";
  const y = raised ? 15 : 18;
  return (
    <g fill="none" stroke={INK} strokeWidth="4.2" strokeLinecap="round">
      <path d={`M52 ${y + 2}q8-${raised ? 6 : 4} 16-1`} />
      <path d={`M78 ${y + 1}q8-${raised ? 5 : 3} 16 1`} />
    </g>
  );
}

function Mouth({ mouth, shinyTeeth }: { mouth: DuoDuoMouth; shinyTeeth: boolean }) {
  const tooth = shinyTeeth ? "#ffffff" : "#ffeeb5";
  if (mouth === "open") {
    return (
      <g>
        <path d="M50 60c8-4 46-4 56 0 2 14-8 28-28 28s-30-14-28-28Z" fill="#8a2a2a" stroke={GREEN_DARK} strokeWidth="2.4" />
        <path d="M60 80c6-7 30-7 36 0-5 5-12 7-18 7s-13-2-18-7Z" fill="#ff6b6b" />
        {[56, 64, 72, 80, 88, 96].map((x) => (
          <rect key={`t${x}`} x={x - 3.4} y="59.5" width="6.8" height="7.5" rx="2.4" fill={tooth} stroke="#d9c58f" strokeWidth="1" />
        ))}
        {[66, 74, 82, 90].map((x) => (
          <rect key={`b${x}`} x={x - 3.2} y="80" width="6.4" height="6" rx="2.2" fill={tooth} stroke="#d9c58f" strokeWidth="1" />
        ))}
        {shinyTeeth ? (
          <g fill="#fff" stroke="#8ddff0" strokeWidth="1.2">
            <path d="M58 52l1.6 3.4 3.4 1.6-3.4 1.6-1.6 3.4-1.6-3.4-3.4-1.6 3.4-1.6Z" />
            <path d="M101 54l1.2 2.6 2.6 1.2-2.6 1.2-1.2 2.6-1.2-2.6-2.6-1.2 2.6-1.2Z" />
          </g>
        ) : null}
      </g>
    );
  }
  if (mouth === "chew") {
    return <path d="M66 70q6 7 12 0q6 7 12 0" fill="none" stroke={INK} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />;
  }
  if (mouth === "laugh") {
    return (
      <g>
        <path d="M56 64h44q0 20-22 20t-22-20Z" fill="#8a2a2a" stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
        <path d="M66 78q12-7 24 0-5 5-12 5t-12-5Z" fill="#ff6b6b" />
        {[64, 72, 84, 92].map((x) => (
          <rect key={x} x={x - 3} y="64.5" width="6" height="5" rx="2" fill={tooth} stroke="#d9c58f" strokeWidth="1" />
        ))}
      </g>
    );
  }
  return (
    <g>
      <path d="M50 68q28 18 56 0" fill="none" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
      {[
        [64, 74.2],
        [72, 76.1],
        [84, 76.1],
        [92, 74.2],
      ].map(([x, y]) => (
        <rect key={x} x={x - 3} y={y} width="6" height="5" rx="2" fill={tooth} stroke="#d9c58f" strokeWidth="1" />
      ))}
    </g>
  );
}

/** 芥末：排氣管噗一朵白雲。 */
function PuffCloud() {
  return (
    <g fill="#fff" stroke="#9aa6b2" strokeWidth="2">
      <circle cx="-3" cy="80" r="9" />
      <circle cx="-11" cy="67" r="10.5" />
      <circle cx="2" cy="62" r="8" />
    </g>
  );
}

function SweetStars() {
  return (
    <g fill="#ffd34d" stroke="#d9a514" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M38 8l2.4 5 5.4.8-3.9 3.8.9 5.4-4.8-2.6-4.8 2.6.9-5.4-3.9-3.8 5.4-.8Z" />
      <path d="M114 26l1.9 3.9 4.3.6-3.1 3 .7 4.3-3.8-2-3.8 2 .7-4.3-3.1-3 4.3-.6Z" />
    </g>
  );
}

function Hearts() {
  return (
    <g fill="#ff7a9c" stroke="#e04568" strokeWidth="1.2">
      <path d="M104 14c-2-3-7-1-5 3l5 5 5-5c2-4-3-6-5-3Z" />
      <path d="M45 10c-1.6-2.4-5.6-.8-4 2.4l4 4 4-4c1.6-3.2-2.4-4.8-4-2.4Z" />
    </g>
  );
}

export function DuoDuoArt({ mouth, face, shinyTeeth = false, size = "100%", style }: Props) {
  const blush = face === "love" || face === "sweet" || face === "yum" || face === "puff";
  return (
    <svg viewBox="-18 0 138 110" width={size} height={size} style={style} aria-hidden focusable="false">
      <ellipse cx="62" cy="104" rx="52" ry="5" fill="#3d3028" opacity="0.16" />
      {/* 排氣管 */}
      <rect x="6" y="80" width="12" height="7" rx="3" fill="#9a958f" stroke="#6b6560" strokeWidth="1.6" />
      {face === "puff" ? <PuffCloud /> : null}
      {/* 背刺 */}
      <Spike d="M14 60l2-14 11 8Z" />
      <Spike d="M20 46l6-13 9 10Z" />
      <Spike d="M31 35l9-11 6 12Z" />
      {/* 車身（側面） */}
      <path d="M12 86c-4-20 4-40 26-46h20v52H18c-3 0-5-2-6-6Z" fill={GREEN} stroke={GREEN_DARK} strokeWidth="2.4" strokeLinejoin="round" />
      <rect x="20" y="54" width="15" height="21" rx="6" fill="#4a90d9" stroke="#2f6fb0" strokeWidth="2" />
      <ellipse cx="25" cy="59" rx="3" ry="1.6" fill="#fff" opacity="0.6" />
      <circle cx="42" cy="66" r="3.4" fill="#7ccf4a" stroke={GREEN_DARK} strokeWidth="1.2" />
      <circle cx="44" cy="76" r="2.4" fill="#7ccf4a" stroke={GREEN_DARK} strokeWidth="1.2" />
      {/* 頭頂刺 */}
      <Spike d="M50 22l4-14 10 9Z" />
      <Spike d="M64 16l9-12 6 13Z" />
      <Spike d="M80 17l11-8 1 14Z" />
      {/* 頭（車頭） */}
      <path d="M44 40c0-18 14-26 34-26s34 8 34 26v40c0 12-10 16-34 16s-34-4-34-16Z" fill={GREEN} stroke={GREEN_DARK} strokeWidth="2.4" />
      <ellipse cx="60" cy="22" rx="8" ry="3" fill="#fff" opacity="0.32" />
      {/* 吻部 */}
      <path d="M40 54c4-9 20-12 38-12s34 3 38 12v24c0 11-14 15-38 15s-38-4-38-15Z" fill={MUZZLE} stroke={GREEN_DARK} strokeWidth="2" />
      <ellipse cx="68" cy="50" rx="2.6" ry="2" fill={GREEN_DARK} />
      <ellipse cx="88" cy="50" rx="2.6" ry="2" fill={GREEN_DARK} />
      {blush ? (
        <g fill="#ff9fb7" opacity="0.6">
          <ellipse cx="48" cy="62" rx="4" ry="2.6" />
          <ellipse cx="108" cy="62" rx="4" ry="2.6" />
        </g>
      ) : null}
      <Mouth mouth={mouth} shinyTeeth={shinyTeeth} />
      {face === "yum" && mouth === "closed" ? <ellipse cx="101" cy="74" rx="4" ry="3.2" fill="#ff6b6b" stroke="#c94a4a" strokeWidth="1.2" transform="rotate(-25 101 74)" /> : null}
      <Eyes face={face} />
      <Brows face={face} />
      {face === "love" ? <Hearts /> : null}
      {face === "sweet" ? <SweetStars /> : null}
      {/* 前擋泥板＋輪子 */}
      <Wheel cx={24} cy={93} r={8} />
      <path d="M44 92c0-8 6-13 13-13s13 5 13 13" fill={GREEN} stroke={GREEN_DARK} strokeWidth="2.2" />
      <Wheel cx={57} cy={95} r={9} />
      <path d="M88 92c0-8 6-13 13-13s11 5 11 13" fill={GREEN} stroke={GREEN_DARK} strokeWidth="2.2" />
      <Wheel cx={100} cy={95} r={9} />
    </svg>
  );
}

/** 刷牙小動作的牙刷（canon 道具：藍白牙刷）。 */
export function ToothbrushArt({ size = "100%", style }: { size?: number | string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} style={style} aria-hidden focusable="false">
      <rect x="21" y="16" width="8" height="30" rx="4" fill="#3d7fd6" stroke="#2a5fa8" strokeWidth="1.8" transform="rotate(-30 25 31)" />
      <rect x="22" y="31" width="5" height="9" rx="2.5" fill="#fff" opacity="0.85" transform="rotate(-30 25 31)" />
      <rect x="9" y="4" width="13" height="14" rx="3" fill="#fff" stroke="#9fb6cc" strokeWidth="1.6" transform="rotate(-30 15 11)" />
      <path d="M10 8h11M10 12h11" stroke="#8ddff0" strokeWidth="1.6" transform="rotate(-30 15 11)" />
      <path d="M6 5c2-3 5-1 7-3s5 0 7-2" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M6 5c2-3 5-1 7-3s5 0 7-2" fill="none" stroke="#5fb7e8" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="2 3" />
    </svg>
  );
}
