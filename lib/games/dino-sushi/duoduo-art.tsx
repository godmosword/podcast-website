import { useId, type CSSProperties } from "react";
import type { Mood } from "./reactions";

/**
 * 恐龍車多多（canon：綠車身＋淺綠吻部、橘色背刺、粗黑眉、頭頂大圓眼、藍色側窗、四顆黑輪、無手腳）。
 * 3/4 正面，車頭朝右。消消樂的淡紫多多是糖果色，不是角色 canon。
 * 黏土質感只用漸層與同色系疊色（不用 filter，低階手機也畫得動）：上亮下暗、底緣內陰影、左上柔高光。
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
const GREEN_LIGHT = "#88da5c";
const GREEN_SHADE = "#4ea32f";
const GREEN_DARK = "#347c22";
const MUZZLE = "#8fd14f";
const MUZZLE_LIGHT = "#b8eb82";
const MUZZLE_SHADE = "#84c84a";
const SPIKE = "#f28a2e";
const SPIKE_LIGHT = "#ffae5c";
const SPIKE_DARK = "#cf6a1a";
const INK = "#2c2a28";

/** 這隻多多用的漸層（id 帶 useId，廚房和結算同時有兩隻也不會互相借用）。 */
type Paint = { body: string; muzzle: string; spike: string; tire: string; hub: string; window: string; mouth: string; tooth: string };

function paintIds(uid: string): Paint {
  const id = (name: string) => `${uid}-${name}`;
  return {
    body: id("body"),
    muzzle: id("muzzle"),
    spike: id("spike"),
    tire: id("tire"),
    hub: id("hub"),
    window: id("window"),
    mouth: id("mouth"),
    tooth: id("tooth"),
  };
}

const url = (id: string) => `url(#${id})`;

function PaintDefs({ p, shinyTeeth }: { p: Paint; shinyTeeth: boolean }) {
  return (
    <defs>
      <linearGradient id={p.body} gradientUnits="userSpaceOnUse" x1="0" y1="10" x2="0" y2="100">
        <stop offset="0" stopColor={GREEN_LIGHT} />
        <stop offset="0.55" stopColor={GREEN} />
        <stop offset="1" stopColor={GREEN_SHADE} />
      </linearGradient>
      <linearGradient id={p.muzzle} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={MUZZLE_LIGHT} />
        <stop offset="0.6" stopColor={MUZZLE} />
        <stop offset="1" stopColor={MUZZLE_SHADE} />
      </linearGradient>
      <linearGradient id={p.spike} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={SPIKE_LIGHT} />
        <stop offset="1" stopColor={SPIKE} />
      </linearGradient>
      <radialGradient id={p.tire} cx="0.4" cy="0.35" r="0.7">
        <stop offset="0" stopColor="#4d4946" />
        <stop offset="1" stopColor={INK} />
      </radialGradient>
      <radialGradient id={p.hub} cx="0.35" cy="0.3" r="0.8">
        <stop offset="0" stopColor="#e2ddd6" />
        <stop offset="1" stopColor="#8a847e" />
      </radialGradient>
      <linearGradient id={p.window} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#7cb6ee" />
        <stop offset="1" stopColor="#3f80cc" />
      </linearGradient>
      <radialGradient id={p.mouth} cx="0.5" cy="0.3" r="0.8">
        <stop offset="0" stopColor="#b2403b" />
        <stop offset="1" stopColor="#5a1b1e" />
      </radialGradient>
      <linearGradient id={p.tooth} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={shinyTeeth ? "#ffffff" : "#fffbea"} />
        <stop offset="1" stopColor={shinyTeeth ? "#eef8ff" : "#f3dfa0"} />
      </linearGradient>
    </defs>
  );
}

function Wheel({ cx, cy, r = 9, p }: { cx: number; cy: number; r?: number; p: Paint }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={url(p.tire)} />
      <circle cx={cx} cy={cy} r={r * 0.45} fill={url(p.hub)} />
      <circle cx={cx - r * 0.2} cy={cy - r * 0.25} r={r * 0.16} fill="#fff" opacity="0.6" />
    </g>
  );
}

function Spike({ d, p }: { d: string; p: Paint }) {
  return <path d={d} fill={url(p.spike)} stroke={SPIKE_DARK} strokeWidth="1.8" strokeLinejoin="round" />;
}

/** 圓潤、大小略不一的牙（跟封面的牙一樣，不是一排同尺寸的方塊）。 */
function Tooth({ x, top, w, h, p }: { x: number; top: number; w: number; h: number; p: Paint }) {
  return <rect x={x - w / 2} y={top} width={w} height={h} rx={Math.min(w, h) * 0.46} fill={url(p.tooth)} stroke="#d9c58f" strokeWidth="1" />;
}

function Eyes({ face, p }: { face: DuoDuoFace; p: Paint }) {
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
  // 看泡泡：泡泡在右上（多多車頭朝右），瞳孔往右上看；往左上看會像在不理人
  const pupil = face === "look" ? { dx: 2.6, dy: -3.4 } : { dx: 0.8, dy: 0.6 };
  return (
    <g>
      {[61, 85].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={32} r="10" fill="#fff" stroke={INK} strokeWidth="2" />
          <circle cx={cx + pupil.dx} cy={32 + pupil.dy} r="5" fill={INK} />
          <circle cx={cx + pupil.dx + 1.8} cy={32 + pupil.dy - 1.8} r="1.7" fill="#fff" />
          {/* 好吃：臉頰往上推、眼睛下半被蓋住（瞇眼笑），不是畫一條線（大尺寸會像黑眼圈） */}
          {face === "yum" ? <path d={`M${cx - 11.5} 45Q${cx} 32 ${cx + 11.5} 45Z`} fill={url(p.body)} /> : null}
          {face === "yum" ? <path d={`M${cx - 9.5} 42.6Q${cx} 34.4 ${cx + 9.5} 42.6`} fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" /> : null}
        </g>
      ))}
    </g>
  );
}

function Brows({ face }: { face: DuoDuoFace }) {
  const raised = face === "look" || face === "puff";
  const y = raised ? 15 : 18;
  // 看泡泡時拱頂再抬 1 讀成期待；內側端點不動（再往上會壓到頭頂的刺、跑出頭的輪廓）
  const arch = face === "look" ? 1 : 0;
  return (
    <g fill="none" stroke={INK} strokeWidth="4.2" strokeLinecap="round">
      <path d={`M52 ${y + 2}q8-${raised ? 6 + arch : 4} 16-1`} />
      <path d={`M78 ${y + 1}q8-${raised ? 5 + arch : 3} 16 1`} />
    </g>
  );
}

/** 上排／下排牙：中間兩顆最大，往兩側略小。 */
const TOP_TEETH = [
  [56, 6.4, 7],
  [64, 7.2, 8],
  [72, 7.8, 8.8],
  [80, 7.8, 8.8],
  [88, 7.2, 8],
  [96, 6.4, 7],
] as const;
const BOTTOM_TEETH = [
  [66, 6.2, 5.4],
  [74, 7, 6.4],
  [82, 7, 6.4],
  [90, 6.2, 5.4],
] as const;

function Mouth({ mouth, shinyTeeth, p }: { mouth: DuoDuoMouth; shinyTeeth: boolean; p: Paint }) {
  if (mouth === "open") {
    return (
      <g>
        <path d="M50 60c8-4 46-4 56 0 2 14-8 28-28 28s-30-14-28-28Z" fill={url(p.mouth)} stroke={GREEN_DARK} strokeWidth="2.4" />
        {/* 舌頭：有一道亮面，嘴巴看起來是深的 */}
        <path d="M60 80c6-7 30-7 36 0-5 5-12 7-18 7s-13-2-18-7Z" fill="#ff7272" />
        <path d="M68 78.4c4-2.4 12-2.6 17-.6" fill="none" stroke="#ffb3b3" strokeWidth="1.8" strokeLinecap="round" />
        {TOP_TEETH.map(([x, w, h]) => (
          <Tooth key={`t${x}`} x={x} top={59.2} w={w} h={h} p={p} />
        ))}
        {BOTTOM_TEETH.map(([x, w, h]) => (
          <Tooth key={`b${x}`} x={x} top={86 - h} w={w} h={h} p={p} />
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
    return (
      <g>
        <path d="M66 70q6 7 12 0q6 7 12 0" fill="none" stroke={INK} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    );
  }
  if (mouth === "laugh") {
    return (
      <g>
        <path d="M56 64h44q0 20-22 20t-22-20Z" fill={url(p.mouth)} stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
        <path d="M66 78q12-7 24 0-5 5-12 5t-12-5Z" fill="#ff7272" />
        {[
          [64, 6, 5],
          [72, 6.8, 5.8],
          [84, 6.8, 5.8],
          [92, 6, 5],
        ].map(([x, w, h]) => (
          <Tooth key={x} x={x} top={64.4} w={w} h={h} p={p} />
        ))}
      </g>
    );
  }
  return (
    <g>
      <path d="M50 68q28 18 56 0" fill="none" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
      {[
        [64, 74.2, 6, 5],
        [72, 75.9, 6.8, 5.8],
        [84, 75.9, 6.8, 5.8],
        [92, 74.2, 6, 5],
      ].map(([x, y, w, h]) => (
        <Tooth key={x} x={x} top={y} w={w} h={h} p={p} />
      ))}
    </g>
  );
}

/** 芥末：排氣管噗一朵白雲（雲形＋底部灰影＋噗線；出現時由排氣管長大，見廚房 CSS）。 */
function PuffCloud() {
  return (
    <g data-part="puff-cloud">
      <path
        d="M-12 88c-6 0-9-5-7-9-4-2-4-8 0-10-1-6 5-10 10-8 2-5 9-7 13-3 5-2 10 2 9 7 4 1 6 6 3 9 2 4-1 8-5 8-1 3-5 5-8 3-3 3-9 3-11 0-1 2-3 3-4 3Z"
        fill="#fff"
        stroke="#a99c90"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M-15 84c4 2 8 2 11 0 3 2 8 3 12 0 2 1 5 1 7-1" fill="none" stroke="#d3dbe3" strokeWidth="2.4" strokeLinecap="round" />
      <ellipse cx="-6" cy="68" rx="4" ry="2" fill="#fff" opacity="0.9" />
      <g stroke="#a99c90" strokeWidth="1.6" strokeLinecap="round">
        <path d="M-1 74l3-3M0 80h4M-2 86l3 2" />
      </g>
    </g>
  );
}

/** 甜甜的：三顆星從嘴邊彈出往上飄（錯開時間，見廚房 CSS）。 */
function SweetStars() {
  const star = (cx: number, cy: number, r: number) => {
    const pts = Array.from({ length: 10 }, (_, i) => {
      const a = (Math.PI / 5) * i - Math.PI / 2;
      const rr = i % 2 === 0 ? r : r * 0.48;
      return `${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`;
    });
    return `M${pts.join("L")}Z`;
  };
  return (
    <g data-part="sweet-stars" fill="#ffd34d" stroke="#d9a514" strokeWidth="1.6" strokeLinejoin="round">
      {(
        [
          [110, 58, 6.5, 0],
          [116, 40, 5.5, 90],
          [104, 24, 6, 180],
        ] as const
      ).map(([cx, cy, r, delay]) => (
        <path
          key={cx}
          d={star(cx, cy, r)}
          style={{ ["--sx" as string]: `${((104 - cx) * 0.4).toFixed(1)}px`, ["--d" as string]: `${delay}ms` }}
        />
      ))}
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
  const p = paintIds(useId().replace(/:/g, ""));
  const blush = face === "love" || face === "sweet" || face === "yum" || face === "puff";
  return (
    <svg viewBox="-18 0 138 110" width={size} height={size} style={style} aria-hidden focusable="false">
      <PaintDefs p={p} shinyTeeth={shinyTeeth} />
      <ellipse cx="62" cy="104" rx="52" ry="5" fill="#3d3028" opacity="0.16" />
      {/* 排氣管 */}
      <rect x="6" y="80" width="12" height="7" rx="3" fill="#9a958f" stroke="#6b6560" strokeWidth="1.6" />
      <rect x="8" y="81.5" width="7" height="1.6" rx="0.8" fill="#fff" opacity="0.45" />
      {face === "puff" ? <PuffCloud /> : null}
      {/* 背刺 */}
      <Spike d="M14 60l2-14 11 8Z" p={p} />
      <Spike d="M20 46l6-13 9 10Z" p={p} />
      <Spike d="M31 35l9-11 6 12Z" p={p} />
      {/* 車身（側面）：上亮下暗＋底緣一道同色系內陰影＋左上細亮邊 */}
      <path d="M12 86c-4-20 4-40 26-46h20v52H18c-3 0-5-2-6-6Z" fill={url(p.body)} stroke={GREEN_DARK} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M13.6 82c1.4 4 3 6 5.4 6.6H57v4.4H18c-3 0-5-2-6-6Z" fill={GREEN_DARK} opacity="0.2" />
      <path d="M16 72c0-13 7-24 20-28" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" opacity="0.2" />
      <ellipse cx="25" cy="50" rx="5" ry="2.2" fill="#fff" opacity="0.25" transform="rotate(-35 25 50)" />
      <rect x="20" y="54" width="15" height="21" rx="6" fill={url(p.window)} stroke="#2f6fb0" strokeWidth="2" />
      <ellipse cx="25" cy="59" rx="3" ry="1.6" fill="#fff" opacity="0.65" />
      <circle cx="42" cy="66" r="3.4" fill="#7ccf4a" stroke={GREEN_DARK} strokeWidth="1.2" />
      <circle cx="44" cy="76" r="2.4" fill="#7ccf4a" stroke={GREEN_DARK} strokeWidth="1.2" />
      {/* 頭頂刺 */}
      <Spike d="M50 22l4-14 10 9Z" p={p} />
      <Spike d="M64 16l9-12 6 13Z" p={p} />
      <Spike d="M80 17l11-8 1 14Z" p={p} />
      {/* 頭（車頭）：漸層＋左上細亮邊＋右緣背光 */}
      <path d="M44 40c0-18 14-26 34-26s34 8 34 26v40c0 12-10 16-34 16s-34-4-34-16Z" fill={url(p.body)} stroke={GREEN_DARK} strokeWidth="2.4" />
      <path d="M48.5 36c1.5-10 9-17 21-19.5" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" opacity="0.2" />
      {/* 光從左上來：車頭右緣背光 */}
      <path d="M103 21c6 4 9 11 9 19v40c0 8-5 12-15 14 6-3 9-7 9-14V40c0-8-1-14-3-19Z" fill={GREEN_DARK} opacity="0.18" />
      {/* 嚼嚼：兩頰鼓起來（畫在吻部之前，吻部蓋住內半，外緣鼓出輪廓） */}
      {mouth === "chew" ? (
        <g data-part="cheeks">
          {[42, 113].map((cx) => (
            <g key={cx}>
              <ellipse cx={cx} cy={66} rx="7.5" ry="7" fill={url(p.muzzle)} stroke={GREEN_DARK} strokeWidth="1.8" />
            </g>
          ))}
        </g>
      ) : null}
      {/* 吻部：淺綠漸層＋底緣內陰影＋左上一顆霧面大高光 */}
      <path d="M40 54c4-9 20-12 38-12s34 3 38 12v24c0 11-14 15-38 15s-38-4-38-15Z" fill={url(p.muzzle)} stroke={GREEN_DARK} strokeWidth="2" />
      <path d="M41 74v4c0 11 14 15 37 15s37-4 37-15v-4c0 9-14 13-37 13s-37-4-37-13Z" fill={GREEN_DARK} opacity="0.1" />
      <ellipse cx="56" cy="52" rx="10" ry="3.4" fill="#fff" opacity="0.22" />
      <path d="M46 52c6-5 16-7 26-7.6" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" opacity="0.2" />
      {/* 眼下一道暗影：眼睛像嵌在頭上，不是貼上去的 */}
      <g fill={GREEN_DARK} opacity="0.14">
        <ellipse cx="61" cy="43.5" rx="8.5" ry="2" />
        <ellipse cx="85" cy="43.5" rx="8.5" ry="2" />
      </g>
      <ellipse cx="68" cy="50" rx="2.6" ry="2" fill={GREEN_DARK} />
      <ellipse cx="88" cy="50" rx="2.6" ry="2" fill={GREEN_DARK} />
      {blush ? (
        <g fill="#ff9fb7" opacity="0.6">
          <ellipse cx="48" cy="62" rx="4" ry="2.6" />
          <ellipse cx="108" cy="62" rx="4" ry="2.6" />
        </g>
      ) : null}
      <Mouth mouth={mouth} shinyTeeth={shinyTeeth} p={p} />
      {face === "yum" && mouth === "closed" ? <ellipse cx="101" cy="74" rx="4" ry="3.2" fill="#ff6b6b" stroke="#c94a4a" strokeWidth="1.2" transform="rotate(-25 101 74)" /> : null}
      <Eyes face={face} p={p} />
      <Brows face={face} />
      {face === "love" ? <Hearts /> : null}
      {face === "sweet" ? <SweetStars /> : null}
      {/* 前擋泥板＋輪子 */}
      <Wheel cx={24} cy={93} r={8} p={p} />
      <path d="M44 92c0-8 6-13 13-13s13 5 13 13" fill={url(p.body)} stroke={GREEN_DARK} strokeWidth="2.2" />
      <Wheel cx={57} cy={95} r={9} p={p} />
      <path d="M88 92c0-8 6-13 13-13s11 5 11 13" fill={url(p.body)} stroke={GREEN_DARK} strokeWidth="2.2" />
      <Wheel cx={100} cy={95} r={9} p={p} />
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
