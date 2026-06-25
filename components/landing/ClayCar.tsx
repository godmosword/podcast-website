import { useId, type ReactNode } from "react";
import { ClayGrad, ClaySoftShadow } from "@/lib/games/clay-svg";
import type { MascotExpression } from "@/lib/landing-mascot";

type ClayCarProps = {
  expression: MascotExpression;
  size?: number;
  className?: string;
};

/**
 * 黏土風小車車（側面 3/4、車頭朝左），對標附圖：
 * 大眼睛長在車頭、左上圓頂擋風窗、左下單一前燈、底部黑輪奶油輪轂。
 * 純裝飾、無語意。
 */
export default function ClayCar({
  expression,
  size = 132,
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
      height={size * 0.76}
      viewBox="0 0 152 116"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <ClayGrad id={body} light="#ff6f5f" mid="#ee4133" dark="#c4322a" />
        <ClayGrad id={win} light="#cdecff" mid="#94d2f4" dark="#6cb6e4" />
        <ClaySoftShadow id={sh} />
      </defs>

      {/* 排氣煙（在車尾＝右側） */}
      {expression === "wave" && <Smoke />}

      <g filter={`url(#${sh})`}>
        {/* 車身：圓潤黏土塊，車頭朝左 */}
        <path
          d="M16 80 C6 64 13 45 32 40 C42 28 62 26 75 35 C88 27 113 31 127 46 C140 58 141 75 131 84 C126 89 117 91 106 91 L38 91 C27 91 20 86 16 80 Z"
          fill={`url(#${body})`}
        />
        {/* 擋風窗：車頂偏左的圓頂 */}
        <path
          d="M41 43 C47 30 67 28 79 39 C73 47 52 49 43 47 Z"
          fill={`url(#${win})`}
        />
        {/* 黏土左上高光 */}
        <ellipse cx="36" cy="50" rx="11" ry="6" fill="#fff" opacity="0.3" />
        {/* 前燈（車頭左下單顆） */}
        <ellipse cx="20" cy="70" rx="6" ry="7" fill="#ffd24a" />
      </g>

      {/* 表情（眼睛＋嘴巴在車頭側） */}
      <Face expression={expression} />

      {/* 揮手的手（車頂左上伸出） */}
      {expression === "wave" && (
        <g className="mascot-wave-hand">
          <path
            d="M45 46 C40 34 42 23 51 23"
            fill="none"
            stroke="#ee4133"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <circle cx="52" cy="21" r="7" fill="#ee4133" />
          <circle cx="48" cy="14" r="2.6" fill="#ee4133" />
          <circle cx="53" cy="12.5" r="2.6" fill="#ee4133" />
          <circle cx="58" cy="14.5" r="2.6" fill="#ee4133" />
        </g>
      )}

      {/* 輪子 */}
      <Wheel cx={48} cy={94} sh={sh} />
      <Wheel cx={104} cy={94} sh={sh} />
    </svg>
  );
}

function Wheel({ cx, cy, sh }: { cx: number; cy: number; sh: string }) {
  return (
    <g filter={`url(#${sh})`}>
      <circle cx={cx} cy={cy} r="12" fill="#39352f" />
      <circle cx={cx} cy={cy} r="5.8" fill="#efe6dc" />
      <circle cx={cx - 1.8} cy={cy - 2} r="1.9" fill="#fff" opacity="0.55" />
    </g>
  );
}

function Smoke() {
  return (
    <g className="mascot-smoke" fill="#ffffff" opacity="0.85">
      <circle cx="140" cy="78" r="4.5" />
      <circle cx="147" cy="83" r="3.2" />
      <circle cx="150" cy="74" r="2.4" />
    </g>
  );
}

const EYE = { left: 58, right: 84, cy: 64, r: 13 } as const;

/** 各表情：眼睛 + 嘴巴（必要時加眉毛），位置集中在車頭側。 */
function Face({ expression }: { expression: MascotExpression }): ReactNode {
  switch (expression) {
    case "star":
      return (
        <>
          <EyeWhite />
          <Star cx={EYE.left} cy={EYE.cy} />
          <Star cx={EYE.right} cy={EYE.cy} />
          <path d="M64 80 Q71 90 78 80 Z" fill="#2a2622" />
        </>
      );
    case "surprised":
      return (
        <>
          <EyeWhite />
          <circle cx={EYE.left} cy={EYE.cy - 2} r="5" fill="#2a2622" />
          <circle cx={EYE.right} cy={EYE.cy - 2} r="5" fill="#2a2622" />
          <ellipse cx="71" cy="82" rx="4.2" ry="5.2" fill="#2a2622" />
        </>
      );
    case "angry":
      return (
        <>
          <EyeWhite />
          <Pupil cx={EYE.left} cy={EYE.cy + 2} />
          <Pupil cx={EYE.right} cy={EYE.cy + 2} />
          <path
            d="M47 53 L66 59"
            stroke="#2a2622"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M95 53 L76 59"
            stroke="#2a2622"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M63 84 Q71 78 79 84"
            fill="none"
            stroke="#2a2622"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      );
    case "squint":
      return (
        <>
          <path
            d="M47 65 Q58 53 69 65"
            fill="none"
            stroke="#2a2622"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M73 65 Q84 53 95 65"
            fill="none"
            stroke="#2a2622"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path d="M62 79 Q71 91 80 79 Z" fill="#2a2622" />
        </>
      );
    case "wave":
      return (
        <>
          <EyeWhite />
          <Pupil cx={EYE.left} cy={EYE.cy} />
          <Pupil cx={EYE.right} cy={EYE.cy} />
          <path d="M63 79 Q71 90 79 79 Z" fill="#2a2622" />
        </>
      );
    case "smile":
    default:
      return (
        <>
          <EyeWhite />
          <Pupil cx={EYE.left} cy={EYE.cy} />
          <Pupil cx={EYE.right} cy={EYE.cy} />
          <path
            d="M64 80 Q71 86 78 80"
            fill="none"
            stroke="#2a2622"
            strokeWidth="3"
            strokeLinecap="round"
          />
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
      <circle cx={cx} cy={cy} r="7.5" fill="#2a2622" />
      <circle cx={cx - 2.4} cy={cy - 2.8} r="2.3" fill="#fff" />
    </g>
  );
}

function Star({ cx, cy }: { cx: number; cy: number }) {
  return <polygon points={starPoints(cx, cy, 8.5, 3.8)} fill="#2a2622" />;
}

function starPoints(
  cx: number,
  cy: number,
  outer: number,
  inner: number,
): string {
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
