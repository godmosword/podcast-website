import type { ReactNode } from "react";

type ClayGradProps = {
  id: string;
  light: string;
  mid: string;
  dark: string;
};

export function ClayGrad({ id, light, mid, dark }: ClayGradProps) {
  return (
    <linearGradient id={id} x1="0%" y1="0%" x2="85%" y2="100%">
      <stop offset="0%" stopColor={light} />
      <stop offset="55%" stopColor={mid} />
      <stop offset="100%" stopColor={dark} />
    </linearGradient>
  );
}

export function ClaySoftShadow({ id }: { id: string }) {
  return (
    <filter id={id} x="-25%" y="-25%" width="150%" height="150%">
      <feDropShadow
        dx="0"
        dy="2.5"
        stdDeviation="2"
        floodColor="#3d3028"
        floodOpacity="0.2"
      />
    </filter>
  );
}

type ClayBlobProps = {
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
  gradId: string;
  shadowId: string;
  highlight?: boolean;
};

/** 黏土圓角塊：漸層填色 + 左上高光。 */
export function ClayBlob({
  x,
  y,
  w,
  h,
  r,
  gradId,
  shadowId,
  highlight = true,
}: ClayBlobProps) {
  return (
    <g filter={`url(#${shadowId})`}>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={r}
        ry={r}
        fill={`url(#${gradId})`}
      />
      {highlight && (
        <ellipse
          cx={x + w * 0.28}
          cy={y + h * 0.22}
          rx={w * 0.22}
          ry={h * 0.14}
          fill="#fff"
          opacity="0.38"
        />
      )}
    </g>
  );
}

type ClayCircleProps = {
  cx: number;
  cy: number;
  r: number;
  gradId: string;
  shadowId: string;
};

export function ClayCircle({ cx, cy, r, gradId, shadowId }: ClayCircleProps) {
  return (
    <g filter={`url(#${shadowId})`}>
      <circle cx={cx} cy={cy} r={r} fill={`url(#${gradId})`} />
      <ellipse
        cx={cx - r * 0.28}
        cy={cy - r * 0.32}
        rx={r * 0.35}
        ry={r * 0.22}
        fill="#fff"
        opacity="0.42"
      />
    </g>
  );
}

type ClayWheelProps = {
  cx: number;
  cy: number;
  r?: number;
  shadowId: string;
};

function ClayWheel({ cx, cy, r = 5.5, shadowId }: ClayWheelProps) {
  return (
    <g filter={`url(#${shadowId})`}>
      <circle cx={cx} cy={cy} r={r} fill="#3a3632" />
      <circle cx={cx} cy={cy} r={r * 0.55} fill="#6b6560" />
      <circle cx={cx - r * 0.15} cy={cy - r * 0.18} r={r * 0.18} fill="#fff" opacity="0.35" />
    </g>
  );
}

type ClayCarProps = {
  x: number;
  y: number;
  bodyGrad: string;
  roofGrad: string;
  windowGrad: string;
  shadowId: string;
  scale?: number;
};

/** 簡化黏土小車（側視）。 */
export function ClayCar({
  x,
  y,
  bodyGrad,
  roofGrad,
  windowGrad,
  shadowId,
  scale = 1,
}: ClayCarProps) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} filter={`url(#${shadowId})`}>
      <rect x="0" y="14" width="38" height="14" rx="6" fill={`url(#${bodyGrad})`} />
      <ellipse cx="10" cy="10" rx="8" ry="5" fill="#fff" opacity="0.32" />
      <rect x="10" y="4" width="18" height="12" rx="5" fill={`url(#${roofGrad})`} />
      <rect x="14" y="7" width="10" height="7" rx="3" fill={`url(#${windowGrad})`} />
      <ellipse cx="33" cy="18" rx="3" ry="2.5" fill="#fff8dc" opacity="0.85" />
      <ClayWheel cx={9} cy={28} shadowId={shadowId} />
      <ClayWheel cx={29} cy={28} shadowId={shadowId} />
    </g>
  );
}

type ClaySceneProps = {
  uid: string;
  bg: ReactNode;
  children: ReactNode;
};

/** 卡片黏土場景外框（共用 defs + 背景）。 */
export function ClayScene({ uid, bg, children }: ClaySceneProps) {
  const sh = `${uid}-sh`;
  return (
    <>
      <defs>
        <ClaySoftShadow id={sh} />
        {bg}
      </defs>
      {children}
    </>
  );
}

export function clayIds(uid: string, name: string) {
  return `${uid}-${name}`;
}
