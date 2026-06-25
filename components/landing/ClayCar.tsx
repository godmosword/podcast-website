import { useId, type ReactNode } from "react";
import { ClayGrad, ClaySoftShadow } from "@/lib/games/clay-svg";
import type { MascotExpression } from "@/lib/landing-mascot";

type ClayCarProps = {
  expression: MascotExpression;
  size?: number;
  className?: string;
};

/** 黏土風小車車（正面 3/4），對標附圖 6 種表情。純裝飾、無語意。 */
export default function ClayCar({
  expression,
  size = 112,
  className,
}: ClayCarProps) {
  const uid = useId().replace(/[:]/g, "");
  const body = `${uid}-body`;
  const win = `${uid}-win`;
  const sh = `${uid}-sh`;

  return (
    <svg
      className={className}
      width={size}
      height={size * 0.78}
      viewBox="0 0 120 94"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <ClayGrad id={body} light="#ff6b5e" mid="#ef4b3f" dark="#c8362c" />
        <ClayGrad id={win} light="#bfe6ff" mid="#8fd0f5" dark="#6bb7e6" />
        <ClaySoftShadow id={sh} />
      </defs>

      {/* 揮手冒煙：尾氣在車身後方先畫 */}
      {expression === "wave" && <Smoke />}

      {/* 車身 */}
      <g filter={`url(#${sh})`}>
        <path
          d="M14 64 C10 44 26 30 60 30 C92 30 108 44 106 64 C107 74 100 80 90 80 L30 80 C20 80 13 74 14 64 Z"
          fill={`url(#${body})`}
        />
        {/* 擋風玻璃 */}
        <path
          d="M40 33 C46 26 74 26 80 33 L74 47 L46 47 Z"
          fill={`url(#${win})`}
        />
        {/* 左上高光 */}
        <ellipse cx="40" cy="42" rx="13" ry="7" fill="#fff" opacity="0.3" />
        {/* 黃色車燈 */}
        <circle cx="16" cy="62" r="5" fill="#ffd34d" />
        <circle cx="104" cy="62" r="5" fill="#ffd34d" />
      </g>

      {/* 表情 */}
      <Face expression={expression} />

      {/* 揮手的手 */}
      {expression === "wave" && (
        <g className="mascot-wave-hand">
          <circle cx="96" cy="26" r="6.5" fill="#ef4b3f" />
          <circle cx="96" cy="26" r="2.5" fill="#fff" opacity="0.35" />
        </g>
      )}

      {/* 輪子 */}
      <Wheel cx={40} cy={82} sh={sh} />
      <Wheel cx={80} cy={82} sh={sh} />
    </svg>
  );
}

function Wheel({ cx, cy, sh }: { cx: number; cy: number; sh: string }) {
  return (
    <g filter={`url(#${sh})`}>
      <circle cx={cx} cy={cy} r="11" fill="#3a3632" />
      <circle cx={cx} cy={cy} r="5.5" fill="#efe7df" />
      <circle cx={cx - 1.6} cy={cy - 2} r="1.8" fill="#fff" opacity="0.5" />
    </g>
  );
}

function Smoke() {
  return (
    <g className="mascot-smoke" fill="#ffffff" opacity="0.85">
      <circle cx="12" cy="70" r="4" />
      <circle cx="6" cy="74" r="3" />
      <circle cx="3" cy="68" r="2.2" />
    </g>
  );
}

const EYE = { left: 47, right: 73, cy: 56, r: 11 } as const;

/** 各表情：眼睛 + 嘴巴（必要時加眉毛）。 */
function Face({ expression }: { expression: MascotExpression }): ReactNode {
  switch (expression) {
    case "star":
      return (
        <>
          <EyeWhite />
          <Star cx={EYE.left} cy={EYE.cy} />
          <Star cx={EYE.right} cy={EYE.cy} />
          <path
            d="M52 70 Q60 78 68 70"
            fill="#2a2622"
            stroke="#2a2622"
            strokeWidth="2"
          />
        </>
      );
    case "surprised":
      return (
        <>
          <EyeWhite />
          <circle cx={EYE.left} cy={EYE.cy} r="4.5" fill="#2a2622" />
          <circle cx={EYE.right} cy={EYE.cy} r="4.5" fill="#2a2622" />
          <ellipse cx="60" cy="71" rx="4" ry="5" fill="#2a2622" />
        </>
      );
    case "angry":
      return (
        <>
          <EyeWhite />
          <Pupil cx={EYE.left} cy={EYE.cy + 1} />
          <Pupil cx={EYE.right} cy={EYE.cy + 1} />
          <path d="M40 47 L54 52" stroke="#2a2622" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M80 47 L66 52" stroke="#2a2622" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M52 73 Q60 67 68 73" fill="none" stroke="#2a2622" strokeWidth="3" strokeLinecap="round" />
        </>
      );
    case "squint":
      return (
        <>
          <path d="M38 56 Q47 48 56 56" fill="none" stroke="#2a2622" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M64 56 Q73 48 82 56" fill="none" stroke="#2a2622" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M50 68 Q60 80 70 68" fill="#2a2622" stroke="#2a2622" strokeWidth="2" />
        </>
      );
    case "wave":
      return (
        <>
          <EyeWhite />
          <Pupil cx={EYE.left} cy={EYE.cy} />
          <Pupil cx={EYE.right} cy={EYE.cy} />
          <path d="M50 68 Q60 80 70 68" fill="#2a2622" stroke="#2a2622" strokeWidth="2" />
        </>
      );
    case "smile":
    default:
      return (
        <>
          <EyeWhite />
          <Pupil cx={EYE.left} cy={EYE.cy} />
          <Pupil cx={EYE.right} cy={EYE.cy} />
          <path d="M53 70 Q60 76 67 70" fill="none" stroke="#2a2622" strokeWidth="3" strokeLinecap="round" />
        </>
      );
  }
}

function EyeWhite() {
  return (
    <>
      <circle cx={EYE.left} cy={EYE.cy} r={EYE.r} fill="#fff" />
      <circle cx={EYE.right} cy={EYE.cy} r={EYE.r} fill="#fff" />
    </>
  );
}

function Pupil({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r="6.5" fill="#2a2622" />
      <circle cx={cx - 2} cy={cy - 2.4} r="2" fill="#fff" />
    </g>
  );
}

function Star({ cx, cy }: { cx: number; cy: number }) {
  const pts = starPoints(cx, cy, 7.5, 3.4);
  return <polygon points={pts} fill="#2a2622" />;
}

function starPoints(cx: number, cy: number, outer: number, inner: number): string {
  const coords: string[] = [];
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    coords.push(
      `${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`,
    );
  }
  return coords.join(" ");
}
